import { DurableObject } from "cloudflare:workers";
import { isKnownWord } from "../engine/dictionary";
import { normalizeWord } from "../engine/normalization";
import {
  createCellSolutionCounts,
  createCellSolutionWords,
  findAllWordsOnBoard,
  getMaxScore,
  isWordOnBoard,
} from "../engine/solver";
import { generateBoard } from "../game/board";
import {
  DEFAULT_GAME_DURATION_SECONDS,
  getGameEndTime,
  isGameFinished,
  GameStatus,
} from "../game/game-state";
import { scoreWord } from "../game/scoring";
import { Board, BoardSolution, Env, GameMode, GameOptions, Player } from "../shared/types";
import { ClientMessage, ServerMessage } from "../shared/messages";

const ROOM_STATE_KEY = "roomState";

const DEFAULT_GAME_OPTIONS: GameOptions = {
  durationMode: "timer",
  durationSeconds: DEFAULT_GAME_DURATION_SECONDS,
  uniqueWords: false,
  penalizeInvalidWords: false,
  invalidWordPenalty: 1,
  maxHelpLevel: 3,
  targetScoreMode: "percentOfMaxScore",
  targetScorePercent: 70,
  targetScore: 50,
  soundEnabled: true,
  masterVolume: 0.65,
  visualEffectsEnabled: true,
};

type PlayerAttachment = {
  id: string;
  name: string;
  foundWords: string[];
  invalidWords: string[];
  score: number;
};

type FoundWordOwner = {
  playerId: string;
  playerName: string;
};

type StoredRoomState = {
  status: GameStatus;
  mode: GameMode;
  gameOptions: GameOptions;
  board: Board | null;
  startedAt: number | null;
  endedAt: number | null;
  durationSeconds: number;
  solutions: BoardSolution[];
  solveDurationMs: number;
  globalFoundWords: [string, FoundWordOwner][];
};

export class BoggleRoom extends DurableObject {
  private roomId = "";
  private status: GameStatus = "waiting";
  private mode: GameMode = "timed";
  private gameOptions: GameOptions = { ...DEFAULT_GAME_OPTIONS };
  private board: Board | null = null;
  private startedAt: number | null = null;
  private endedAt: number | null = null;
  private durationSeconds = DEFAULT_GAME_DURATION_SECONDS;
  private loaded = false;
  private solutions: BoardSolution[] = [];
  private solveDurationMs = 0;
  private globalFoundWords = new Map<string, FoundWordOwner>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.roomId = ctx.id.toString();
  }

  async fetch(request: Request): Promise<Response> {
    await this.loadRoomState();

    const roomName = request.headers.get("X-Room-Name");

    if (roomName) {
      this.roomId = roomName;
    }

    const upgradeHeader = request.headers.get("Upgrade");

    if (upgradeHeader !== "websocket") {
      return new Response("Cette route attend une connexion WebSocket.", {
        status: 426,
      });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);

    const playerAttachment = this.createDefaultPlayerAttachment();

    server.serializeAttachment(playerAttachment);

    this.send(server, {
      type: "connected",
      roomId: this.roomId,
      playerId: playerAttachment.id,
    });

    this.broadcast({
      type: "system",
      text: "Un joueur a rejoint la room.",
    });

    this.broadcastPlayers();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    await this.loadRoomState();
    await this.endGameIfNeeded();

    if (typeof message !== "string") {
      return;
    }

    let data: ClientMessage;

    try {
      data = JSON.parse(message);
    } catch {
      this.send(ws, {
        type: "system",
        text: "Message JSON invalide.",
      });

      return;
    }

    if (data.type === "join") {
      const currentAttachment = this.getPlayerAttachment(ws);
      const name = data.name.trim().slice(0, 30) || "joueur";

      ws.serializeAttachment({
        ...currentAttachment,
        name,
      });

      this.broadcast({
        type: "system",
        text: `${name} a rejoint la partie.`,
      });

      this.broadcastPlayers();
      await this.sendCurrentGameState(ws);

      return;
    }

    if (data.type === "startGame") {
      await this.startGame(ws, data.mode ?? "timed", data.board, data.options);
      return;
    }

    if (data.type === "endGame") {
      await this.endGameIfNeeded(true);
      return;
    }

    if (data.type === "submitWord") {
      await this.submitWord(ws, data.word);
      return;
    }
  }

  async webSocketClose(ws: WebSocket) {
    const name = this.getPlayerName(ws);

    this.broadcast({
      type: "system",
      text: `${name} a quitté la room.`,
    });

    this.broadcastPlayers();
  }

  async webSocketError() {
    this.broadcastPlayers();
  }

  async alarm() {
    await this.loadRoomState();
    await this.endGameIfNeeded(true);
  }

  private async startGame(
    ws: WebSocket,
    mode: GameMode,
    customBoard?: Board,
    options?: Partial<GameOptions>
  ) {
    const name = this.getPlayerName(ws);

    if (
      this.status === "playing" &&
      this.mode === "timed" &&
      !this.hasCurrentGameFinished()
    ) {
      this.send(ws, {
        type: "system",
        text: "Une partie chronométrée est déjà en cours.",
      });

      return;
    }

    const board =
      customBoard && customBoard.length > 0
        ? this.normalizeCustomBoard(customBoard)
        : generateBoard();

    if (!board) {
      this.send(ws, {
        type: "system",
        text: "Grille personnalisée invalide : utilisez une grille carrée de 3 à 5 lettres par côté.",
      });

      return;
    }

    this.status = "playing";
    this.mode = mode;
    this.gameOptions = this.normalizeGameOptions(mode, options);
    this.board = board;

    const solveStartedAt = Date.now();
    this.solutions = findAllWordsOnBoard(this.board);
    this.solveDurationMs = Date.now() - solveStartedAt;

    this.startedAt = Date.now();
    this.endedAt = null;
    this.durationSeconds =
      this.mode === "timed" && this.gameOptions.durationMode === "timer"
        ? this.gameOptions.durationSeconds
        : 0;

    this.resetAllPlayersForNewGame();
    this.globalFoundWords.clear();

    await this.saveRoomState();

    if (this.mode === "timed" && this.gameOptions.durationMode === "timer") {
      await this.ctx.storage.setAlarm(
        getGameEndTime(this.startedAt, this.durationSeconds)
      );
    } else {
      await this.ctx.storage.deleteAlarm();
    }

    this.broadcast({
      type: "system",
      text:
        this.mode === "solution"
          ? `${name} a lancé un mode solution sans timer.`
          : this.gameOptions.durationMode === "timer"
            ? `${name} a lancé une nouvelle partie chronométrée.`
            : `${name} a lancé une nouvelle partie sans timer.`,
    });

    this.broadcast({
      type: "gameStarted",
      status: "playing",
      mode: this.mode,
      gameOptions: this.gameOptions,
      board: this.board,
      startedAt: this.startedAt,
      durationSeconds: this.durationSeconds,
    });

    this.broadcastSolutionStats();
    this.broadcastPlayers();
  }

  private normalizeGameOptions(
    mode: GameMode,
    options?: Partial<GameOptions>
  ): GameOptions {
    if (mode === "solution") {
      return {
        ...DEFAULT_GAME_OPTIONS,
        durationMode: "noTimer",
        durationSeconds: 0,
        maxHelpLevel: 3,
        soundEnabled: options?.soundEnabled !== false,
        masterVolume: this.clampVolume(
          options?.masterVolume ?? DEFAULT_GAME_OPTIONS.masterVolume
        ),
        visualEffectsEnabled: options?.visualEffectsEnabled !== false,
      };
    }

    const durationMode =
      options?.durationMode === "noTimer" || options?.durationMode === "targetScore"
        ? options.durationMode
        : "timer";

    const durationSeconds = this.clampDurationSeconds(
      options?.durationSeconds ?? DEFAULT_GAME_DURATION_SECONDS
    );

    return {
      durationMode,
      durationSeconds,
      uniqueWords: Boolean(options?.uniqueWords),
      penalizeInvalidWords: Boolean(options?.penalizeInvalidWords),
      invalidWordPenalty: this.clampPenalty(
        options?.invalidWordPenalty ?? DEFAULT_GAME_OPTIONS.invalidWordPenalty
      ),
      maxHelpLevel: this.clampHelpLevel(
        options?.maxHelpLevel ?? DEFAULT_GAME_OPTIONS.maxHelpLevel
      ),
      targetScoreMode:
        options?.targetScoreMode === "fixedScore" ? "fixedScore" : "percentOfMaxScore",
      targetScorePercent: this.clampTargetScorePercent(
        options?.targetScorePercent ?? DEFAULT_GAME_OPTIONS.targetScorePercent
      ),
      targetScore: this.clampTargetScore(
        options?.targetScore ?? DEFAULT_GAME_OPTIONS.targetScore
      ),
      soundEnabled: options?.soundEnabled !== false,
      masterVolume: this.clampVolume(
        options?.masterVolume ?? DEFAULT_GAME_OPTIONS.masterVolume
      ),
      visualEffectsEnabled: options?.visualEffectsEnabled !== false,
    };
  }

  private clampDurationSeconds(value: number) {
    if (!Number.isFinite(value)) {
      return DEFAULT_GAME_DURATION_SECONDS;
    }

    return Math.min(3600, Math.max(15, Math.round(value)));
  }

  private clampPenalty(value: number) {
    if (!Number.isFinite(value)) {
      return DEFAULT_GAME_OPTIONS.invalidWordPenalty;
    }

    return Math.min(10, Math.max(1, Math.round(value)));
  }

  private clampHelpLevel(value: number) {
    if (!Number.isFinite(value)) {
      return DEFAULT_GAME_OPTIONS.maxHelpLevel;
    }

    return Math.min(3, Math.max(0, Math.round(value)));
  }

  private clampTargetScorePercent(value: number) {
    if (!Number.isFinite(value)) {
      return DEFAULT_GAME_OPTIONS.targetScorePercent;
    }

    return Math.min(100, Math.max(1, Math.round(value)));
  }

  private clampTargetScore(value: number) {
    if (!Number.isFinite(value)) {
      return DEFAULT_GAME_OPTIONS.targetScore;
    }

    return Math.min(9999, Math.max(1, Math.round(value)));
  }

  private clampVolume(value: number) {
    if (!Number.isFinite(value)) {
      return DEFAULT_GAME_OPTIONS.masterVolume;
    }

    return Math.min(1, Math.max(0, value));
  }

  private getMaxScore() {
    return this.solutions.reduce((total, solution) => total + solution.score, 0);
  }

  private getTargetScore() {
    if (this.gameOptions.targetScoreMode === "fixedScore") {
      return this.gameOptions.targetScore;
    }

    return Math.max(
      1,
      Math.ceil((this.getMaxScore() * this.gameOptions.targetScorePercent) / 100)
    );
  }

  private normalizeCustomBoard(board: Board) {
    if (!Array.isArray(board)) {
      return null;
    }

    const size = board.length;

    if (size < 3 || size > 5) {
      return null;
    }

    const normalizedBoard: Board = [];

    for (const row of board) {
      if (!Array.isArray(row) || row.length !== size) {
        return null;
      }

      const normalizedRow: string[] = [];

      for (const cell of row) {
        const normalizedLetter = normalizeWord(String(cell))[0];

        if (!normalizedLetter) {
          return null;
        }

        normalizedRow.push(normalizedLetter);
      }

      normalizedBoard.push(normalizedRow);
    }

    return normalizedBoard;
  }

  private async submitWord(ws: WebSocket, rawWord: string) {
    await this.endGameIfNeeded();

    const word = normalizeWord(rawWord);
    const attachment = this.getPlayerAttachment(ws);

    if (this.status !== "playing") {
      this.send(ws, {
        type: "wordRejected",
        word,
        reason: "Aucune partie n’est en cours.",
        reasonCode: "notPlaying",
      });

      return;
    }

    if (!this.board) {
      this.send(ws, {
        type: "wordRejected",
        word,
        reason: "La grille n’est pas disponible.",
        reasonCode: "boardUnavailable",
      });

      return;
    }

    if (word.length < 3) {
      this.send(ws, {
        type: "wordRejected",
        word,
        reason: "Le mot doit contenir au moins 3 lettres.",
        reasonCode: "tooShort",
      });

      return;
    }

    if (attachment.foundWords.includes(word)) {
      this.send(ws, {
        type: "wordRejected",
        word,
        reason: "Mot déjà trouvé.",
        reasonCode: "duplicate",
      });

      return;
    }

    if (this.gameOptions.uniqueWords) {
      const owner = this.globalFoundWords.get(word);

      if (owner && owner.playerId !== attachment.id) {
        this.send(ws, {
          type: "wordRejected",
          word,
          reason: `Mot déjà trouvé par ${owner.playerName}.`,
          reasonCode: "taken",
        });

        return;
      }
    }

    if (!isKnownWord(word)) {
      this.rejectInvalidWord(ws, word, "Ce mot n’est pas dans le dictionnaire.");
      return;
    }

    if (!isWordOnBoard(word, this.board)) {
      this.rejectInvalidWord(ws, word, "Ce mot n’est pas formable sur la grille.");
      return;
    }

    const points = scoreWord(word);

    if (points <= 0) {
      this.rejectInvalidWord(ws, word, "Ce mot ne rapporte aucun point.");
      return;
    }

    const updatedAttachment: PlayerAttachment = {
      ...attachment,
      foundWords: [...attachment.foundWords, word],
      score: attachment.score + points,
    };

    ws.serializeAttachment(updatedAttachment);

    if (this.gameOptions.uniqueWords) {
      this.globalFoundWords.set(word, {
        playerId: updatedAttachment.id,
        playerName: updatedAttachment.name,
      });

      await this.saveRoomState();
    }

    this.send(ws, {
      type: "wordAccepted",
      word,
      points,
      score: updatedAttachment.score,
    });

    this.broadcastPlayers();

    if (
      this.gameOptions.durationMode === "targetScore" &&
      updatedAttachment.score >= this.getTargetScore()
    ) {
      await this.endGameIfNeeded(true);
    }
  }

  private rejectInvalidWord(ws: WebSocket, word: string, reason: string) {
    const attachment = this.getPlayerAttachment(ws);
    const alreadyTriedByThisPlayer = attachment.invalidWords.includes(word);
    const penalty =
      this.gameOptions.penalizeInvalidWords && !alreadyTriedByThisPlayer
        ? this.gameOptions.invalidWordPenalty
        : 0;

    const updatedAttachment: PlayerAttachment = {
      ...attachment,
      invalidWords: alreadyTriedByThisPlayer
        ? attachment.invalidWords
        : [...attachment.invalidWords, word],
      score: attachment.score - penalty,
    };

    ws.serializeAttachment(updatedAttachment);

    this.send(ws, {
      type: "wordRejected",
      word,
      reason: alreadyTriedByThisPlayer && this.gameOptions.penalizeInvalidWords
        ? `${reason} Déjà tenté : pas de nouvelle pénalité.`
        : reason,
      reasonCode: "invalid",
      penalty,
      score: updatedAttachment.score,
    });

    if (penalty > 0) {
      this.broadcastPlayers();
    }
  }

  private async endGameIfNeeded(force = false) {
    if (this.status !== "playing") {
      return;
    }

    if (!force && this.gameOptions.durationMode !== "timer") {
      return;
    }

    if (!this.board || !this.startedAt) {
      return;
    }

    if (!force && !this.hasCurrentGameFinished()) {
      return;
    }

    this.status = "ended";
    this.endedAt = Date.now();

    await this.saveRoomState();

    this.broadcast({
      type: "system",
      text: "La partie est terminée.",
    });

    this.broadcast({
      type: "gameEnded",
      status: "ended",
      mode: this.mode,
      gameOptions: this.gameOptions,
      board: this.board,
      startedAt: this.startedAt,
      durationSeconds: this.durationSeconds,
      endedAt: this.endedAt,
    });

    this.broadcastSolutionStats();
    this.broadcastPlayers();
  }

  private hasCurrentGameFinished() {
    if (this.gameOptions.durationMode !== "timer") {
      return false;
    }

    if (!this.startedAt) {
      return false;
    }

    return isGameFinished(this.startedAt, this.durationSeconds);
  }

  private async sendCurrentGameState(ws: WebSocket) {
    if (this.status === "playing") {
      await this.endGameIfNeeded();
    }

    if (this.status === "playing" && this.board && this.startedAt) {
      this.send(ws, {
        type: "gameStarted",
        status: "playing",
        mode: this.mode,
        gameOptions: this.gameOptions,
        board: this.board,
        startedAt: this.startedAt,
        durationSeconds: this.durationSeconds,
      });

      this.sendSolutionStats(ws);

      return;
    }

    if (
      this.status === "ended" &&
      this.board &&
      this.startedAt &&
      this.endedAt
    ) {
      this.send(ws, {
        type: "gameEnded",
        status: "ended",
        mode: this.mode,
        gameOptions: this.gameOptions,
        board: this.board,
        startedAt: this.startedAt,
        durationSeconds: this.durationSeconds,
        endedAt: this.endedAt,
      });

      this.sendSolutionStats(ws);

      return;
    }

    this.send(ws, {
      type: "gameStatus",
      status: this.status,
    });
  }

  private async loadRoomState() {
    if (this.loaded) {
      return;
    }

    const stored = await this.ctx.storage.get<StoredRoomState>(ROOM_STATE_KEY);

    if (stored) {
      this.status = stored.status;
      this.mode = stored.mode ?? "timed";
      this.gameOptions = stored.gameOptions ?? { ...DEFAULT_GAME_OPTIONS };
      this.board = stored.board;
      this.startedAt = stored.startedAt;
      this.endedAt = stored.endedAt;
      this.durationSeconds = stored.durationSeconds;
      this.solutions = stored.solutions ?? [];
      this.solveDurationMs = stored.solveDurationMs ?? 0;
      this.globalFoundWords = new Map(stored.globalFoundWords ?? []);

      if (this.board && this.solutions.length === 0) {
        const solveStartedAt = Date.now();
        this.solutions = findAllWordsOnBoard(this.board);
        this.solveDurationMs = Date.now() - solveStartedAt;
      }
    }

    this.loaded = true;
  }

  private async saveRoomState() {
    const roomState: StoredRoomState = {
      status: this.status,
      mode: this.mode,
      gameOptions: this.gameOptions,
      board: this.board,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationSeconds: this.durationSeconds,
      solutions: this.solutions,
      solveDurationMs: this.solveDurationMs,
      globalFoundWords: [...this.globalFoundWords.entries()],
    };

    await this.ctx.storage.put(ROOM_STATE_KEY, roomState);
  }

  private resetAllPlayersForNewGame() {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = this.getPlayerAttachment(ws);

      ws.serializeAttachment({
        ...attachment,
        foundWords: [],
        invalidWords: [],
        score: 0,
      });
    }
  }

  private createDefaultPlayerAttachment(): PlayerAttachment {
    return {
      id: crypto.randomUUID(),
      name: "joueur",
      foundWords: [],
      invalidWords: [],
      score: 0,
    };
  }

  private getPlayerAttachment(ws: WebSocket): PlayerAttachment {
    const attachment = ws.deserializeAttachment() as PlayerAttachment | null;

    if (!attachment) {
      return this.createDefaultPlayerAttachment();
    }

    return {
      ...attachment,
      foundWords: attachment.foundWords ?? [],
      invalidWords: attachment.invalidWords ?? [],
      score: attachment.score ?? 0,
    };
  }

  private getPlayerName(ws: WebSocket) {
    return this.getPlayerAttachment(ws).name;
  }

  private send(ws: WebSocket, message: ServerMessage) {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // socket fermée
    }
  }

  private broadcast(message: ServerMessage) {
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, message);
    }
  }

  private sendSolutionStats(ws: WebSocket) {
    if (!this.board) {
      return;
    }

    this.send(ws, this.createSolutionStatsMessage());
  }

  private broadcastSolutionStats() {
    if (!this.board) {
      return;
    }

    this.broadcast(this.createSolutionStatsMessage());
  }

  private createSolutionStatsMessage(): ServerMessage {
    if (!this.board) {
      return {
        type: "solutionsStats",
        totalWords: 0,
        maxScore: 0,
        cellCounts: [],
        cellWords: [],
        solveDurationMs: 0,
      };
    }

    return {
      type: "solutionsStats",
      totalWords: this.solutions.length,
      maxScore: getMaxScore(this.solutions),
      cellCounts: createCellSolutionCounts(this.board, this.solutions),
      cellWords: createCellSolutionWords(this.board, this.solutions),
      solveDurationMs: this.solveDurationMs,
    };
  }

  private broadcastPlayers() {
    const players: Player[] = [...this.ctx.getWebSockets()].map((ws) => {
      const attachment = this.getPlayerAttachment(ws);

      return {
        id: attachment.id,
        name: attachment.name,
        score: attachment.score,
        wordCount: attachment.foundWords.length,
      };
    });

    this.broadcast({
      type: "players",
      players,
    });
  }
}
