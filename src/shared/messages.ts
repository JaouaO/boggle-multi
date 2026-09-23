import type { GameStatus } from "../game/game-state";
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
	type: "gameStatus";
	status: GameStatus;
}
	| {
	type: "gameStarted";
	status: "playing";
	board: Board;
	startedAt: number;
	durationSeconds: number;
}
	| {
	type: "gameEnded";
	status: "ended";
	board: Board;
	startedAt: number;
	durationSeconds: number;
	endedAt: number;
};
