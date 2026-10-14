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
import { generateBoard, generateSeededBoard, normalizeBoardSize } from "../game/board";
import {
  DEFAULT_GAME_DURATION_SECONDS,
  getGameEndTime,
  isGameFinished,
  GameStatus,
} from "../game/game-state";
import { scoreWord } from "../game/scoring";
import { Board, BoardSize, BoardSolution, GameMode, GameOptions, Player, PlayerFoundWord } from "../shared/types";
import { ClientMessage, ServerMessage } from "../shared/messages";

const ROOM_STATE_KEY = "roomState";

const PUBLIC_ROOM_IDS_V9D3 = new Set([
  "PUBLIC-RAPIDE",
  "PUBLIC-CLASSIQUE",
  "PUBLIC-DETENTE",
]);

const PUBLIC_ROOM_RESTART_DELAY_MS_V9D3 = 15_000;

const DEFAULT_GAME_OPTIONS: GameOptions = {
  durationMode: "timer",
  durationSeconds: DEFAULT_GAME_DURATION_SECONDS,
  boardSize: 4,
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
  joined: boolean;
};

type FoundWordOwner = {
  playerId: string;
  playerName: string;
};

type PlayerSnapshot = {
  id: string;
  name: string;
  foundWords: string[];
  invalidWords: string[];
  score: number;
};

type StoredRoomState = {
  status: GameStatus;
  hostPlayerId: string | null;
  mode: GameMode;
  gameOptions: GameOptions;
  board: Board | null;
  startedAt: number | null;
  endedAt: number | null;
  durationSeconds: number;
  solutions: BoardSolution[];
  solveDurationMs: number;
  globalFoundWords: [string, FoundWordOwner][];
  playerSnapshots: [string, PlayerSnapshot][];
};

export class BoggleRoom extends DurableObject {
  private roomId = "";
  private hostPlayerId: string | null = null;
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
  private playerSnapshots = new Map<string, PlayerSnapshot>();
  private publicRoomWakeupTimeoutV9N: ReturnType<typeof setTimeout> | null = null;

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
      const stablePlayerId = this.normalizeClientId(data.clientId) ?? currentAttachment.id;
      const previousAttachment =
        this.findConnectedPlayerAttachment(stablePlayerId, ws) ??
        this.playerSnapshots.get(stablePlayerId) ??
        currentAttachment;

      this.closeDuplicatePlayerSockets(stablePlayerId, ws);

      const namedAttachment: PlayerAttachment = {
        ...currentAttachment,
        id: stablePlayerId,
        name,
        foundWords: previousAttachment.foundWords ?? [],
        invalidWords: previousAttachment.invalidWords ?? [],
        score: previousAttachment.score ?? 0,
        joined: true,
      };
      const isNewHost = this.ensureHost(namedAttachment.id);

      ws.serializeAttachment(namedAttachment);
      this.updatePlayerSnapshot(namedAttachment);

      this.send(ws, {
        type: "connected",
        roomId: this.roomId,
        playerId: namedAttachment.id,
      });

      if (isNewHost) {
        await this.saveRoomState();
      }

      this.broadcast({
        type: "system",
        text: isNewHost
          ? `${name} a rejoint la partie et devient l’hébergeur de la salle.`
          : `${name} a rejoint la partie.`,
      });

      this.broadcastPlayers();
      await this.sendCurrentGameState(ws);

      if (this.isPublicRoomV9D3()) {
        await this.startPublicRoomRoundIfNeededV9D3();
      }

      return;
    }

    if (data.type === "startGame") {
      if (this.isPublicRoomV9D3()) {
        /* F9O-PUBLIC-MANUAL-ACTIONS : les salons publics sont pilotés par la boucle serveur. */
        this.send(ws, {
          type: "system",
          text: "Les salons publics démarrent automatiquement.",
        });
        return;
      }

      if (!this.isHost(ws)) {
        this.send(ws, {
          type: "system",
          text: "Seul l’hébergeur de la salle peut lancer une partie.",
        });

        return;
      }

      await this.startGame(ws, data.mode ?? "timed", data.board, data.options);
      return;
    }

    if (data.type === "updateGameOptions") {
      await this.updateGameOptions(ws, data.options);
      return;
    }

    if (data.type === "endGame") {
      if (this.isPublicRoomV9D3()) {
        this.send(ws, {
          type: "system",
          text: "Les salons publics se terminent automatiquement.",
        });
        return;
      }

      if (!this.isHost(ws)) {
        this.send(ws, {
          type: "system",
          text: "Seul l’hébergeur de la salle peut terminer la partie.",
        });

        return;
      }

      await this.endGameIfNeeded(true);
      return;
    }

    if (data.type === "submitWord") {
      await this.submitWord(ws, data.word);
      return;
    }
  }


  async webSocketClose(ws: WebSocket) {
    await this.handleDisconnectedSocket(ws);
  }


  async webSocketError(ws: WebSocket) {
    await this.handleDisconnectedSocket(ws);
  }


  private async handleDisconnectedSocket(ws: WebSocket) {
    const attachment = this.getPlayerAttachment(ws);

    if (!attachment.joined) {
      return;
    }

    this.updatePlayerSnapshot(attachment);

    const name = attachment.name;
    const wasHost = this.hostPlayerId === attachment.id;
    const samePlayerStillConnected = this.isPlayerConnected(attachment.id, ws);

    if (samePlayerStillConnected) {
      await this.saveRoomState();
      this.broadcastPlayers();
      return;
    }

    let nextHost: PlayerAttachment | null = null;

    if (wasHost || !this.isHostConnected(ws)) {
      if (wasHost) {
        this.hostPlayerId = null;
      }

      nextHost = this.assignHostFromConnectedPlayers(ws);
    }

    await this.saveRoomState();

    if (wasHost && nextHost) {
      this.broadcast({
        type: "system",
        text: `${name} a quitté la room. ${nextHost.name} devient l’hébergeur de la salle.`,
      });
    } else {
      this.broadcast({
        type: "system",
        text: `${name} a quitté la room.`,
      });
    }

    this.broadcastPlayers(attachment.id);

    await this.stopPublicRoomLoopIfEmptyV9D3(ws);
  }

  async alarm() {
    await this.loadRoomState();

    if (this.isPublicRoomV9D3()) {
      await this.handlePublicRoomAlarmV9D3();
      return;
    }

    await this.endGameIfNeeded(true);
  }
  private async updateGameOptions(
    ws: WebSocket,
    options?: Partial<GameOptions>
  ) {
    if (this.isPublicRoomV9D3()) {
      this.send(ws, {
        type: "system",
        text: "Les règles des salons publics sont fixes.",
      });
      return;
    }

    if (!this.isHost(ws)) {
      this.send(ws, {
        type: "system",
        text: "Seul l’hébergeur de la salle peut modifier les règles.",
      });

      return;
    }

    if (this.status === "playing") {
      this.send(ws, {
        type: "system",
        text: "Les règles ne peuvent plus être modifiées pendant une partie.",
      });

      return;
    }

    this.gameOptions = this.normalizeGameOptions("timed", options);
    await this.saveRoomState();
    this.broadcastGameOptions();
  }

  /*
   * Les rooms quotidiennes personnelles gardent une grille commune par date.
   * Les autres modes conservent la génération aléatoire historique.
   */
  private createGeneratedBoardG4C(options: GameOptions): Board {
    const dailyDateKey = this.getDailyDateKeyG4C();

    if (!dailyDateKey) {
      return generateBoard(options.boardSize);
    }

    const boardSize = normalizeBoardSize(options.boardSize);
    const seed = `daily:${dailyDateKey}:size:${boardSize}`;

    return generateSeededBoard(seed, boardSize);
  }

  private getDailyDateKeyG4C() {
    const match = this.roomId.match(/^GRILLE-DU-JOUR-(\d{4}-\d{2}-\d{2})(?:-|$)/u);

    return match?.[1] ?? null;
  }
  /* Verrou léger contre les relances normales de la grille du jour. */
  private isDailyRoomG5() {
    return Boolean(this.getDailyDateKeyG4C());
  }

  private hasDailyGameAlreadyStartedG5() {
    return (
      this.isDailyRoomG5() &&
      (this.status !== "waiting" || Boolean(this.board) || Boolean(this.startedAt))
    );
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

    if (this.hasDailyGameAlreadyStartedG5()) {
      this.send(ws, {
        type: "system",
        text: "La grille du jour a déjà été jouée pour ce navigateur.",
      });

      return;
    }

    const normalizedOptions = this.normalizeGameOptions(
      mode,
      options ?? this.gameOptions
    );

    const board =
      customBoard && customBoard.length > 0
        ? this.normalizeCustomBoard(customBoard)
        : this.createGeneratedBoardG4C(normalizedOptions);

    if (!board) {
      this.send(ws, {
        type: "system",
        text: "Grille personnalisée invalide : utilisez une grille carrée de 3 à 5 lettres par côté.",
      });

      return;
    }

    this.status = "playing";
    this.mode = mode;
    this.gameOptions = {
      ...normalizedOptions,
      boardSize: this.getBoardSize(board),
    };
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
      const gameEndAt = getGameEndTime(this.startedAt, this.durationSeconds);

      await this.ctx.storage.setAlarm(gameEndAt);

      if (this.isPublicRoomV9D3()) {
        /*
         * F9N-PUBLIC-LOOP-TIMEOUT :
         * en salon public, le serveur doit se réveiller à la fin
         * de la partie, puis à la fin de la pause de relance.
         */
        this.schedulePublicRoomWakeupV9N(gameEndAt);
      }
    } else {
      await this.ctx.storage.deleteAlarm();

      if (this.isPublicRoomV9D3()) {
        this.clearPublicRoomWakeupTimeoutV9N();
      }
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

  /*
   * H4A-UNIQUE-WORDS-SERVER-GUARD :
   * "Mots uniques dans la salle" est une règle multijoueur privée.
   * Le client masque déjà l’option hors salon privé, mais le serveur doit
   * aussi refuser toute activation envoyée manuellement par WebSocket.
   */
  private canUseUniqueWordsOptionH4A() {
    const roomId = this.roomId.toUpperCase();

    return (
      !this.isPublicRoomV9D3() &&
      !roomId.startsWith("SOLO-") &&
      !roomId.startsWith("GRILLE-DU-JOUR-")
    );
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
        boardSize: normalizeBoardSize(options?.boardSize ?? DEFAULT_GAME_OPTIONS.boardSize),
        maxHelpLevel: 3,
        soundEnabled: DEFAULT_GAME_OPTIONS.soundEnabled,
        masterVolume: DEFAULT_GAME_OPTIONS.masterVolume,
        visualEffectsEnabled: DEFAULT_GAME_OPTIONS.visualEffectsEnabled,
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
      boardSize: normalizeBoardSize(options?.boardSize ?? DEFAULT_GAME_OPTIONS.boardSize),
      uniqueWords: this.canUseUniqueWordsOptionH4A() && Boolean(options?.uniqueWords),
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
      soundEnabled: DEFAULT_GAME_OPTIONS.soundEnabled,
      masterVolume: DEFAULT_GAME_OPTIONS.masterVolume,
      visualEffectsEnabled: DEFAULT_GAME_OPTIONS.visualEffectsEnabled,
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

  private getBoardSize(board: Board): BoardSize {
    return normalizeBoardSize(board.length);
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
    this.updatePlayerSnapshot(updatedAttachment);

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
    this.updatePlayerSnapshot(updatedAttachment);

    this.send(ws, {
      type: "wordRejected",
      word,
      reason: alreadyTriedByThisPlayer && this.gameOptions.penalizeInvalidWords
        ? `${reason} Déjà tenté : pas de nouvelle pénalité.`
        : reason,
      reasonCode: "invalid",
      penalty,
      score: updatedAttachment.score,
      invalidCount: updatedAttachment.invalidWords.length,
    });

    if (penalty > 0 || !alreadyTriedByThisPlayer) {
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
    this.playerSnapshots.clear();
    this.updateAllConnectedPlayerSnapshots();

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

    if (this.isPublicRoomV9D3()) {
      await this.scheduleNextPublicRoomRoundV9D3();
    }
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

  private isPublicRoomV9D3() {
    return PUBLIC_ROOM_IDS_V9D3.has(this.roomId.toUpperCase());
  }

  private getPublicRoomGameOptionsV9D4(): GameOptions {
    const roomId = this.roomId.toUpperCase();

    const durationSeconds =
      roomId === "PUBLIC-RAPIDE"
        ? 60
        : roomId === "PUBLIC-DETENTE"
          ? 300
          : 180;

    return {
      ...DEFAULT_GAME_OPTIONS,
      durationMode: "timer",
      durationSeconds,
      penalizeInvalidWords: true,
      invalidWordPenalty: 1,
    };
  }

  private getConnectedJoinedSocketsV9D3(excludedWs?: WebSocket) {
    return this.ctx.getWebSockets().filter((socket) => {
      if (socket === excludedWs) {
        return false;
      }

      const attachment = this.getPlayerAttachment(socket);

      return Boolean(attachment.joined);
    });
  }

  private hasConnectedPublicRoomPlayersV9D3(excludedWs?: WebSocket) {
    return this.getConnectedJoinedSocketsV9D3(excludedWs).length > 0;
  }

  private clearPublicRoomWakeupTimeoutV9N() {
    if (this.publicRoomWakeupTimeoutV9N === null) {
      return;
    }

    clearTimeout(this.publicRoomWakeupTimeoutV9N);
    this.publicRoomWakeupTimeoutV9N = null;
  }

  private schedulePublicRoomWakeupV9N(wakeupAt: number) {
    this.clearPublicRoomWakeupTimeoutV9N();

    const delay = Math.max(0, wakeupAt - Date.now());

    this.publicRoomWakeupTimeoutV9N = setTimeout(() => {
      this.publicRoomWakeupTimeoutV9N = null;

      this.handlePublicRoomAlarmV9D3().catch((error) => {
        console.error("Erreur boucle salon public", error);
      });
    }, delay);
  }

  private getPublicRoomHostSocketV9D3() {
    const sockets = this.getConnectedJoinedSocketsV9D3();

    if (!sockets.length) {
      return null;
    }

    const hostSocket = sockets.find((socket) => {
      const attachment = this.getPlayerAttachment(socket);

      return attachment.id === this.hostPlayerId;
    });

    if (hostSocket) {
      return hostSocket;
    }

    const fallbackSocket = sockets[0];
    const fallbackAttachment = this.getPlayerAttachment(fallbackSocket);
    this.hostPlayerId = fallbackAttachment.id;

    return fallbackSocket;
  }

  private async startPublicRoomRoundIfNeededV9D3() {
    if (!this.isPublicRoomV9D3()) {
      return;
    }

    if (this.status === "playing") {
      await this.endGameIfNeeded();

      if (this.status === "playing") {
        return;
      }
    }

    if (!this.hasConnectedPublicRoomPlayersV9D3()) {
      await this.resetIdlePublicRoomV9D3();
      return;
    }

    if (
      this.status === "ended" &&
      this.endedAt &&
      Date.now() - this.endedAt < PUBLIC_ROOM_RESTART_DELAY_MS_V9D3
    ) {
      await this.ctx.storage.setAlarm(
        this.endedAt + PUBLIC_ROOM_RESTART_DELAY_MS_V9D3
      );
      return;
    }

    const hostSocket = this.getPublicRoomHostSocketV9D3();

    if (!hostSocket) {
      await this.resetIdlePublicRoomV9D3();
      return;
    }

    this.clearPublicRoomWakeupTimeoutV9N();

    await this.startGame(
      hostSocket,
      "timed",
      undefined,
      this.getPublicRoomGameOptionsV9D4()
    );
  }

    private async scheduleNextPublicRoomRoundV9D3() {
    if (!this.hasConnectedPublicRoomPlayersV9D3()) {
      await this.resetIdlePublicRoomV9D3();
      return;
    }

    const restartAt = Date.now() + PUBLIC_ROOM_RESTART_DELAY_MS_V9D3;

    await this.ctx.storage.setAlarm(restartAt);
    this.schedulePublicRoomWakeupV9N(restartAt);

    this.broadcast({
      type: "system",
      text: "Nouvelle partie publique dans 15 secondes.",
    });
  }

    private async handlePublicRoomAlarmV9D3() {
    if (!this.isPublicRoomV9D3()) {
      return;
    }

    if (this.status === "playing") {
      await this.endGameIfNeeded(true);
      return;
    }

    await this.startPublicRoomRoundIfNeededV9D3();
  }

  private async stopPublicRoomLoopIfEmptyV9D3(excludedWs?: WebSocket) {
    if (!this.isPublicRoomV9D3()) {
      return;
    }

    if (this.hasConnectedPublicRoomPlayersV9D3(excludedWs)) {
      return;
    }

    await this.resetIdlePublicRoomV9D3();
  }

    private async resetIdlePublicRoomV9D3() {
    this.clearPublicRoomWakeupTimeoutV9N();

    await this.ctx.storage.deleteAlarm();

    this.status = "waiting";
    this.hostPlayerId = null;
    this.board = null;
    this.startedAt = null;
    this.endedAt = null;
    this.durationSeconds = DEFAULT_GAME_DURATION_SECONDS;
    this.solutions = [];
    this.solveDurationMs = 0;
    this.globalFoundWords.clear();
    this.playerSnapshots.clear();

    await this.saveRoomState();
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

    this.send(ws, {
      type: "gameOptionsUpdated",
      gameOptions: this.gameOptions,
    });
  }

  private async loadRoomState() {
    if (this.loaded) {
      return;
    }

    const stored = await this.ctx.storage.get<StoredRoomState>(ROOM_STATE_KEY);

    if (stored) {
      this.status = stored.status;
      this.hostPlayerId = stored.hostPlayerId ?? null;
      this.mode = stored.mode ?? "timed";
      this.gameOptions = this.normalizeGameOptions(
        stored.mode ?? "timed",
        stored.gameOptions ?? DEFAULT_GAME_OPTIONS
      );
      this.board = stored.board;
      this.startedAt = stored.startedAt;
      this.endedAt = stored.endedAt;
      this.durationSeconds = stored.durationSeconds;
      this.solutions = stored.solutions ?? [];
      this.solveDurationMs = stored.solveDurationMs ?? 0;
      this.globalFoundWords = new Map(stored.globalFoundWords ?? []);
      this.playerSnapshots = new Map(stored.playerSnapshots ?? []);

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
      hostPlayerId: this.hostPlayerId,
      mode: this.mode,
      gameOptions: this.gameOptions,
      board: this.board,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationSeconds: this.durationSeconds,
      solutions: this.solutions,
      solveDurationMs: this.solveDurationMs,
      globalFoundWords: [...this.globalFoundWords.entries()],
      playerSnapshots: [...this.playerSnapshots.entries()],
    };

    await this.ctx.storage.put(ROOM_STATE_KEY, roomState);
  }


  private ensureHost(playerId: string) {
    if (this.hostPlayerId && this.isHostConnected()) {
      return false;
    }

    this.hostPlayerId = playerId;
    return true;
  }


  private isHost(ws: WebSocket) {
    const attachment = this.getPlayerAttachment(ws);

    if (!attachment.joined) {
      return false;
    }

    this.ensureHost(attachment.id);

    return this.hostPlayerId === attachment.id;
  }


  private isHostConnected(excludedWs?: WebSocket) {
    if (!this.hostPlayerId) {
      return false;
    }

    return this.ctx
      .getWebSockets()
      .some((socket) => {
        if (socket === excludedWs) {
          return false;
        }

        const attachment = this.getPlayerAttachment(socket);
        return attachment.joined && attachment.id === this.hostPlayerId;
      });
  }

  private assignHostFromConnectedPlayers(excludedWs?: WebSocket) {
    const nextHostSocket = this.ctx
      .getWebSockets()
      .find((socket) => {
        const attachment = this.getPlayerAttachment(socket);
        return socket !== excludedWs && attachment.joined;
      });

    if (!nextHostSocket) {
      this.hostPlayerId = null;
      return null;
    }

    const nextHost = this.getPlayerAttachment(nextHostSocket);
    this.hostPlayerId = nextHost.id;

    return nextHost;
  }

  private resetAllPlayersForNewGame() {
    this.playerSnapshots.clear();

    for (const ws of this.ctx.getWebSockets()) {
      const attachment = this.getPlayerAttachment(ws);

      if (!attachment.joined) {
        continue;
      }

      const resetAttachment = {
        ...attachment,
        foundWords: [],
        invalidWords: [],
        score: 0,
      };

      ws.serializeAttachment(resetAttachment);
      this.updatePlayerSnapshot(resetAttachment);
    }
  }

  private updateAllConnectedPlayerSnapshots() {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = this.getPlayerAttachment(ws);

      if (attachment.joined) {
        this.updatePlayerSnapshot(attachment);
      }
    }
  }

  private updatePlayerSnapshot(attachment: PlayerAttachment) {
    this.playerSnapshots.set(attachment.id, {
      id: attachment.id,
      name: attachment.name,
      foundWords: [...(attachment.foundWords ?? [])],
      invalidWords: [...(attachment.invalidWords ?? [])],
      score: attachment.score ?? 0,
    });
  }

  private createDefaultPlayerAttachment(): PlayerAttachment {
    return {
      id: crypto.randomUUID(),
      name: "joueur",
      foundWords: [],
      invalidWords: [],
      score: 0,
      joined: false,
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
      joined: Boolean(attachment.joined),
    };
  }

  private getPlayerName(ws: WebSocket) {
    return this.getPlayerAttachment(ws).name;
  }

  private normalizeClientId(clientId?: string) {
    const normalized = String(clientId ?? "")
      .trim()
      .slice(0, 80);

    if (!/^[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  private findConnectedPlayerAttachment(playerId: string, excludedWs?: WebSocket) {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === excludedWs) {
        continue;
      }

      const attachment = this.getPlayerAttachment(socket);

      if (attachment.joined && attachment.id === playerId) {
        return attachment;
      }
    }

    return null;
  }

  private isPlayerConnected(playerId: string, excludedWs?: WebSocket) {
    return Boolean(this.findConnectedPlayerAttachment(playerId, excludedWs));
  }

  private closeDuplicatePlayerSockets(playerId: string, currentWs: WebSocket) {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === currentWs) {
        continue;
      }

      const attachment = this.getPlayerAttachment(socket);

      if (attachment.joined && attachment.id === playerId) {
        try {
          socket.close(1000, "replaced by a newer connection");
        } catch {
          // socket déjà fermée
        }
      }
    }
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

  private broadcastGameOptions() {
    this.broadcast({
      type: "gameOptionsUpdated",
      gameOptions: this.gameOptions,
    });
  }

  private canExposePlayerWords() {
    return this.status === "ended" || (this.status === "playing" && this.mode === "solution");
  }

  private getPlayerFoundWords(words: string[]): PlayerFoundWord[] {
    return words.map((word) => {
      const solution = this.solutions.find((item) => item.word === word);

      return {
        word,
        points: scoreWord(word),
        path: solution?.path ?? solution?.cells ?? [],
      };
    });
  }

  private broadcastPlayers(excludedPlayerId?: string) {
    const exposeWords = this.canExposePlayerWords();
    const connectedAttachmentsById = new Map<string, PlayerAttachment>();

    for (const ws of this.ctx.getWebSockets()) {
      const attachment = this.getPlayerAttachment(ws);

      if (!attachment.joined || attachment.id === excludedPlayerId) {
        continue;
      }

      connectedAttachmentsById.set(attachment.id, attachment);
    }

    const connectedAttachments = [...connectedAttachmentsById.values()];

    for (const attachment of connectedAttachments) {
      this.updatePlayerSnapshot(attachment);
    }

    const sourcePlayers = exposeWords
      ? [...this.playerSnapshots.values()]
      : connectedAttachments;

    const players: Player[] = sourcePlayers.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      score: attachment.score,
      wordCount: attachment.foundWords.length,
      invalidCount: attachment.invalidWords.length,
      isHost: this.hostPlayerId === attachment.id,
      ...(exposeWords
        ? { foundWords: this.getPlayerFoundWords(attachment.foundWords) }
        : {}),
    }));

    this.broadcast({
      type: "players",
      players,
    });
  }
}
