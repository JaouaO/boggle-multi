export const state = {
	socket: null,
	roomId: null,
	playerName: null,

	gameStatus: "waiting",
	board: null,
	startedAt: null,
	endedAt: null,
	durationSeconds: null,

	foundWords: [],
	score: 0,
};
