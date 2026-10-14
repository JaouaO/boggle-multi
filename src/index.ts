export { BoggleRoom } from "./rooms/BoggleRoom";
export { DailyLeaderboard } from "./rooms/DailyLeaderboard";

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

function getDailyLeaderboardDateFromUrl(url: URL) {
	const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

	return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : null;
}

function createDailyLeaderboardRequest(request: Request, date: string) {
	const headers = new Headers(request.headers);
	headers.set("X-Daily-Leaderboard-Date", date);

	return new Request(request, {
		headers,
	});
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

		if (url.pathname === "/api/daily-leaderboard") {
			const date = getDailyLeaderboardDateFromUrl(url);

			if (!date) {
				return json({ ok: false, error: "date invalide" }, { status: 400 });
			}

			const id = env.DAILY_LEADERBOARD.idFromName(date);
			const stub = env.DAILY_LEADERBOARD.get(id);

			return stub.fetch(createDailyLeaderboardRequest(request, date));
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
