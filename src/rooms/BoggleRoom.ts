import { DurableObject } from "cloudflare:workers";
import { generateBoard } from "../game/board";
import type { Board, Env } from "../shared/types";
import type { ClientMessage, ServerMessage } from "../shared/messages";

export class BoggleRoom extends DurableObject {
	private roomId = "";
	private board: Board | null = null;
	private startedAt: number | null = null;
	private durationSeconds = 180;

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

		if (this.board && this.startedAt) {
			this.send(server, {
				type: "gameStarted",
				board: this.board,
				startedAt: this.startedAt,
				durationSeconds: this.durationSeconds,
			});
		}

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
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

			if (this.board && this.startedAt) {
				this.send(ws, {
					type: "gameStarted",
					board: this.board,
					startedAt: this.startedAt,
					durationSeconds: this.durationSeconds,
				});
			}

			return;
		}

		if (data.type === "startGame") {
			const name = this.getPlayerName(ws);

			this.board = generateBoard();
			this.startedAt = Date.now();
			this.durationSeconds = 180;

			this.broadcast({
				type: "system",
				text: `${name} a lancé une nouvelle partie.`,
			});

			this.broadcast({
				type: "gameStarted",
				board: this.board,
				startedAt: this.startedAt,
				durationSeconds: this.durationSeconds,
			});

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
