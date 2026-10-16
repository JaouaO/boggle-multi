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

/* S3 : vérifier les scores dans la salle serveur, jamais depuis le POST public. */
function normalizeDailyPlayerId(value: unknown) {
  const id = String(value ?? "").trim();
  return /^[A-Za-z0-9_-]{8,80}$/u.test(id) ? id : "";
}

async function verifyDailyLeaderboardSubmission(request: Request, env: Env, date: string) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: "requête invalide" }, { status: 400 });
  }
  const fields = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const playerId = normalizeDailyPlayerId(fields.playerId);
  const roomToken = normalizeDailyPlayerId(fields.roomToken);
  if (!playerId || !roomToken) {
    return json({ ok: false, error: "joueur ou salle invalide" }, { status: 400 });
  }

  // Le token de salle est distinct de l'identifiant visible dans les salons.
  const roomId = `GRILLE-DU-JOUR-${date}-${roomToken}`.toUpperCase();
  const room = env.BOGGLE_ROOM.get(env.BOGGLE_ROOM.idFromName(roomId));
  const scoreUrl = new URL("https://boggle.internal/__internal/daily-score-s3");
  scoreUrl.searchParams.set("date", date);
  scoreUrl.searchParams.set("playerId", playerId);
  scoreUrl.searchParams.set("roomToken", roomToken);
  const roomResponse = await room.fetch(new Request(scoreUrl, {
    headers: { "X-Room-Name": roomId },
  }));
  if (!roomResponse.ok) {
    return json(
      { ok: false, error: "partie quotidienne non terminée ou non conforme" },
      { status: 409 }
    );
  }
  const verified: unknown = await roomResponse.json();
  if (
    !verified ||
    typeof verified !== "object" ||
    !("ok" in verified) ||
    !("playerId" in verified) ||
    !("date" in verified) ||
    verified.ok !== true ||
    verified.playerId !== playerId ||
    verified.date !== date
  ) {
    return json({ ok: false, error: "résultat quotidien invalide" }, { status: 409 });
  }
  return verified;
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

            if (request.method === "POST") {
              const verified = await verifyDailyLeaderboardSubmission(request, env, date);
              if (verified instanceof Response) return verified;
              const verifiedRequest = new Request(request.url, {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "X-Daily-Leaderboard-Date": date,
                },
                body: JSON.stringify(verified),
              });
              return stub.fetch(verifiedRequest);
            }
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
