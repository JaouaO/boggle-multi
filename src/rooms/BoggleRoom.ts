import { DurableObject } from "cloudflare:workers";
import { generateBoard } from "../game/board";
import {
	DEFAULT_GAME_DURATION_SECONDS,
	getGameEndTime,
	isGameFinished,
	type GameStatus,
} from "../game/game-state";
import type { Board, Env } from "../shared/types";
import type { ClientMessage, ServerMessage } from "../shared/messages";

export class BoggleRoom extends DurableObject {
	private roomId = "";
	private status: GameStatus = "waiting";
	private board: Board | null = null;
	private startedAt: number | null = null;
	private endedAt: number | null = null;
	private durationSeconds = DEFAULT_GAME_DURATION_SECONDS;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.roomId = ctx.id.toString();
	}

	async fetch(request: Request): Promise<Response> {
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

		server.serializeAttachment({
			name: "joueur",
		});

		this.send(server, {
			type: "connected",
			roomId: this.roomId,
		});

		this.broadcast({
			type: "system",
			text: "Un joueur a rejoint la room.",
		});

		this.broadcastPlayers();
		this.sendCurrentGameState(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		this.endGameIfNeeded();

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
			const name = data.name.trim().slice(0, 30) || "joueur";

			ws.serializeAttachment({ name });

			this.broadcast({
				type: "system",
				text: `${name} a rejoint la partie.`,
			});

			this.broadcastPlayers();
			this.sendCurrentGameState(ws);

			return;
		}

		if (data.type === "startGame") {
			await this.startGame(ws);
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
		this.endGameIfNeeded(true);
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
	}

	private endGameIfNeeded(force = false) {
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
	}

	private hasCurrentGameFinished() {
		if (!this.startedAt) {
			return false;
		}

		return isGameFinished(this.startedAt, this.durationSeconds);
	}

	private sendCurrentGameState(ws: WebSocket) {
		if (this.status === "playing") {
			this.endGameIfNeeded();
		}

		if (
			this.status === "playing" &&
			this.board &&
			this.startedAt
		) {
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

	private getPlayerName(ws: WebSocket) {
		const attachment = ws.deserializeAttachment() as { name?: string } | null;

		return attachment?.name ?? "joueur";
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
		const players = [...this.ctx.getWebSockets()].map((ws) =>
			this.getPlayerName(ws)
		);

		this.broadcast({
			type: "players",
			players,
		});
	}
}
