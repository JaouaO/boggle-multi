export type GameStatus = "waiting" | "playing" | "ended";

export const DEFAULT_GAME_DURATION_SECONDS = 180;

export function getGameEndTime(startedAt: number, durationSeconds: number) {
	return startedAt + durationSeconds * 1000;
}

export function isGameFinished(
	startedAt: number,
	durationSeconds: number,
	now = Date.now()
) {
	return now >= getGameEndTime(startedAt, durationSeconds);
}
