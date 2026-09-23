import { DurableObject } from "cloudflare:workers";
import { isWordOnBoard, normalizeWord } from "../engine/solver";
import { generateBoard } from "../game/board";
import {
	DEFAULT_GAME_DURATION_SECONDS,
	getGameEndTime,
	isGameFinished,
	type GameStatus,
} from "../game/game-state";
import { scoreWord } from "../game/scoring";
import type { Board, Env, Player } from "../shared/types";
import type { ClientMessage, ServerMessage } from "../shared/messages";

const ROOM_STATE_KEY = "roomState";

type PlayerAttachment = {
	id: string;
	name: string;
	foundWords: string[];
	score: number;
};

type StoredRoomState = {
	status: GameStatus;
	board: Board | null;
	startedAt: number | null;
	endedAt: number | null;
	durationSeconds: number;
};

export class BoggleRoom extends DurableObject {
	private roomId = "";
	private status: GameStatus = "waiting";
	private board: Board | null = null;
	private startedAt: number | null = null;
	private endedAt: number | null = null;
	private durationSeconds = DEFAULT_GAME_DURATION_SECONDS;
	private loaded = false;

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

		server.serializeAttachment(this.createDefaultPlayerAttachment());

		this.send(server, {
			type: "connected",
			roomId: this.roomId,
		});

		this.broadcast({
			type: "system",
			text: "Un joueur a rejoint la room.",
		});

		this.broadcastPlayers();
		await this.sendCurrentGameState(server);

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
			await this.startGame(ws);
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

	private async startGame(ws: WebSocket) {
		const name = this.getPlayerName(ws);

		if (this.status === "playing" && !this.hasCurrentGameFinished()) {
			this.send(ws, {
				type: "system",
				text: "Une partie est déjà en cours.",
			});

			return;
		}

		this.status = "playing";
		this.board = generateBoard();
		this.startedAt = Date.now();
		this.endedAt = null;
		this.durationSeconds = DEFAULT_GAME_DURATION_SECONDS;

		this.resetAllPlayersForNewGame();

		await this.saveRoomState();

		await this.ctx.storage.setAlarm(
			getGameEndTime(this.startedAt, this.durationSeconds)
		);

		this.broadcast({
			type: "system",
			text: `${name} a lancé une nouvelle partie.`,
		});

		this.broadcast({
			type: "gameStarted",
			status: "playing",
			board: this.board,
			startedAt: this.startedAt,
			durationSeconds: this.durationSeconds,
		});

		this.broadcastPlayers();
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
			});

			return;
		}

		if (!this.board) {
			this.send(ws, {
				type: "wordRejected",
				word,
				reason: "La grille n’est pas disponible.",
			});

			return;
		}

		if (word.length < 3) {
			this.send(ws, {
				type: "wordRejected",
				word,
				reason: "Le mot doit contenir au moins 3 lettres.",
			});

			return;
		}

		if (attachment.foundWords.includes(word)) {
			this.send(ws, {
				type: "wordRejected",
				word,
				reason: "Mot déjà trouvé.",
			});

			return;
		}

		if (!isWordOnBoard(word, this.board)) {
			this.send(ws, {
				type: "wordRejected",
				word,
				reason: "Ce mot n’est pas formable sur la grille.",
			});

			return;
		}

		const points = scoreWord(word);

		if (points <= 0) {
			this.send(ws, {
				type: "wordRejected",
				word,
				reason: "Ce mot ne rapporte aucun point.",
			});

			return;
		}

		const updatedAttachment: PlayerAttachment = {
			...attachment,
			foundWords: [...attachment.foundWords, word],
			score: attachment.score + points,
		};

		ws.serializeAttachment(updatedAttachment);

		this.send(ws, {
			type: "wordAccepted",
			word,
			points,
			score: updatedAttachment.score,
		});

		this.broadcastPlayers();
	}

	private async endGameIfNeeded(force = false) {
		if (this.status !== "playing") {
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
			board: this.board,
			startedAt: this.startedAt,
			durationSeconds: this.durationSeconds,
			endedAt: this.endedAt,
		});

		this.broadcastPlayers();
	}

	private hasCurrentGameFinished() {
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
				board: this.board,
				startedAt: this.startedAt,
				durationSeconds: this.durationSeconds,
			});

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
				board: this.board,
				startedAt: this.startedAt,
				durationSeconds: this.durationSeconds,
				endedAt: this.endedAt,
			});

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
			this.board = stored.board;
			this.startedAt = stored.startedAt;
			this.endedAt = stored.endedAt;
			this.durationSeconds = stored.durationSeconds;
		}

		this.loaded = true;
	}

	private async saveRoomState() {
		const roomState: StoredRoomState = {
			status: this.status,
			board: this.board,
			startedAt: this.startedAt,
			endedAt: this.endedAt,
			durationSeconds: this.durationSeconds,
		};

		await this.ctx.storage.put(ROOM_STATE_KEY, roomState);
	}

	private resetAllPlayersForNewGame() {
		for (const ws of this.ctx.getWebSockets()) {
			const attachment = this.getPlayerAttachment(ws);

			ws.serializeAttachment({
				...attachment,
				foundWords: [],
				score: 0,
			});
		}
	}

	private createDefaultPlayerAttachment(): PlayerAttachment {
		return {
			id: crypto.randomUUID(),
			name: "joueur",
			foundWords: [],
			score: 0,
		};
	}

	private getPlayerAttachment(ws: WebSocket): PlayerAttachment {
		const attachment = ws.deserializeAttachment() as PlayerAttachment | null;

		return attachment ?? this.createDefaultPlayerAttachment();
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
