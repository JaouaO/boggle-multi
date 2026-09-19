import { DurableObject } from "cloudflare:workers";

export interface Env {
	BOGGLE_ROOM: DurableObjectNamespace<BoggleRoom>;
	ASSETS: Fetcher;
}

type Board = string[][];

type ClientMessage =
	| {
	type: "join";
	name: string;
}
	| {
	type: "startGame";
};

type ServerMessage =
	| {
	type: "connected";
	roomId: string;
}
	| {
	type: "system";
	text: string;
}
	| {
	type: "players";
	players: string[];
}
	| {
	type: "gameStarted";
	board: Board;
	startedAt: number;
	durationSeconds: number;
};

function json(data: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(data, null, 2), {
		...init,
		headers: {
			"content-type": "application/json; charset=utf-8",
			...init.headers,
		},
	});
}

function getRoomIdFromUrl(url: URL) {
	const roomId = url.pathname.replace(/^\/ws\//, "").trim();

	if (!roomId || roomId.includes("/")) {
		return null;
	}

	return roomId.toUpperCase();
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/api/health") {
			return json({
				ok: true,
				service: "boggle-multi",
			});
		}

		if (url.pathname.startsWith("/ws/")) {
			const roomId = getRoomIdFromUrl(url);

			if (!roomId) {
				return new Response("Room invalide", { status: 400 });
			}

			const id = env.BOGGLE_ROOM.idFromName(roomId);
			const stub = env.BOGGLE_ROOM.get(id);

			const headers = new Headers(request.headers);
			headers.set("X-Room-Name", roomId);

			const roomRequest = new Request(request, {
				headers,
			});

			return stub.fetch(roomRequest);
		}

		return env.ASSETS.fetch(request);
	},
};

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

	async webSocketError(ws: WebSocket) {
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

function generateBoard(): Board {
	const letters = [
		"A", "A", "A", "A", "A", "A", "A", "A", "A",
		"E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E",
		"I", "I", "I", "I", "I", "I", "I",
		"O", "O", "O", "O", "O",
		"U", "U", "U", "U",
		"Y",

		"B", "B",
		"C", "C", "C", "C",
		"D", "D", "D",
		"F", "F",
		"G", "G",
		"H",
		"J",
		"K",
		"L", "L", "L", "L", "L",
		"M", "M", "M",
		"N", "N", "N", "N", "N", "N",
		"P", "P", "P",
		"Q",
		"R", "R", "R", "R", "R", "R",
		"S", "S", "S", "S", "S", "S",
		"T", "T", "T", "T", "T", "T",
		"V", "V",
		"W",
		"X",
		"Z",
	];

	const board: Board = [];

	for (let row = 0; row < 4; row++) {
		const line: string[] = [];

		for (let col = 0; col < 4; col++) {
			line.push(randomItem(letters));
		}

		board.push(line);
	}

	return board;
}

function randomItem<T>(items: T[]): T {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);

	return items[array[0] % items.length];
}
