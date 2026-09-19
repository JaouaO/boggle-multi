import type { Board } from "./types";

export type ClientMessage =
	| {
	type: "join";
	name: string;
}
	| {
	type: "startGame";
};

export type ServerMessage =
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
