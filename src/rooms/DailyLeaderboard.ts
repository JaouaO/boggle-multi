type DailyLeaderboardEntry = {
  date: string;
  playerId: string;
  playerName: string;
  score: number;
  wordCount: number;
  invalidCount: number;
  helpLevel: number;
  durationSeconds: number;
  submittedAt: number;
};

type RankedDailyLeaderboardEntry = DailyLeaderboardEntry & {
  rank: number;
};

// S3 : les entrées antérieures restent archivées, jamais mêlées aux scores vérifiés.
const STORAGE_KEY = "verifiedEntriesS3";
const MAX_STORED_ENTRIES = 200;
const PUBLIC_TOP_LIMIT = 10;

export class DailyLeaderboard {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const date = normalizeDateKey(
      request.headers.get("X-Daily-Leaderboard-Date") ?? url.searchParams.get("date")
    );

    if (!date) {
      return json(
        {
          ok: false,
          error: "date invalide",
        },
        { status: 400 }
      );
    }

    if (request.method === "GET") {
      return this.handleGet(date, url);
    }

    if (request.method === "POST") {
      return this.handlePost(date, request);
    }

    return json(
      {
        ok: false,
        error: "méthode non autorisée",
      },
      { status: 405 }
    );
  }

  private async handleGet(date: string, url: URL) {
    const playerId = normalizePlayerId(url.searchParams.get("playerId"));
    const entries = await this.readEntries();

    return json(buildLeaderboardResponse(date, entries, playerId));
  }

  private async handlePost(date: string, request: Request) {
    const payload = await readJsonBody(request);
    // Le Worker n'envoie ici que la réponse vérifiée du Durable Object de jeu.
    const entry = normalizeSubmission(date, payload);

    if (!entry) {
      return json(
        {
          ok: false,
          error: "score invalide",
        },
        { status: 400 }
      );
    }

    const entries = await this.readEntries();
    const previousEntry = entries[entry.playerId];
    const stored = !previousEntry || shouldReplaceEntry(entry, previousEntry);

    if (stored) {
      entries[entry.playerId] = entry;
      await this.ctx.storage.put(STORAGE_KEY, trimStoredEntries(entries));
    }

    const updatedEntries = stored ? entries : { ...entries, [entry.playerId]: previousEntry };

    return json({
      ...buildLeaderboardResponse(date, updatedEntries, entry.playerId),
      stored,
    });
  }

  private async readEntries() {
    const entries = await this.ctx.storage.get<Record<string, DailyLeaderboardEntry>>(STORAGE_KEY);

    if (!entries || typeof entries !== "object") {
      return {};
    }

    return entries;
  }
}

function buildLeaderboardResponse(
  date: string,
  entries: Record<string, DailyLeaderboardEntry>,
  playerId = ""
) {
  const rankedEntries = rankEntries(Object.values(entries));
  // Ne pas divulguer publiquement les identifiants des navigateurs / salles.
  const topEntries = rankedEntries.slice(0, PUBLIC_TOP_LIMIT).map(({ playerId: _privateId, ...entry }) => entry);
  const playerEntry = playerId
    ? rankedEntries.find((entry) => entry.playerId === playerId) ?? null
    : null;

  return {
    ok: true,
    date,
    totalEntries: rankedEntries.length,
    entries: topEntries,
    playerEntry,
    playerRank: playerEntry?.rank ?? null,
  };
}

function trimStoredEntries(entries: Record<string, DailyLeaderboardEntry>) {
  return Object.fromEntries(
    rankEntries(Object.values(entries))
      .slice(0, MAX_STORED_ENTRIES)
      .map((entry) => [entry.playerId, withoutRank(entry)])
  );
}

function rankEntries(entries: DailyLeaderboardEntry[]): RankedDailyLeaderboardEntry[] {
  return [...entries]
    .sort(compareEntries)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function compareEntries(a: DailyLeaderboardEntry, b: DailyLeaderboardEntry) {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  if (a.wordCount !== b.wordCount) {
    return b.wordCount - a.wordCount;
  }

  if (a.invalidCount !== b.invalidCount) {
    return a.invalidCount - b.invalidCount;
  }

  if (a.durationSeconds !== b.durationSeconds) {
    return a.durationSeconds - b.durationSeconds;
  }

  return a.submittedAt - b.submittedAt;
}

function shouldReplaceEntry(candidate: DailyLeaderboardEntry, previous: DailyLeaderboardEntry) {
  return compareEntries(candidate, previous) < 0;
}

function withoutRank(entry: RankedDailyLeaderboardEntry | DailyLeaderboardEntry) {
  const { rank: _rank, ...entryWithoutRank } = entry as RankedDailyLeaderboardEntry;

  return entryWithoutRank;
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeSubmission(date: string, payload: unknown): DailyLeaderboardEntry | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const playerId = normalizePlayerId(data.playerId);

  if (data.ok !== true || data.date !== date || !playerId ||
      typeof data.score !== "number" || !Number.isInteger(data.score) ||
      typeof data.wordCount !== "number" || !Number.isInteger(data.wordCount) ||
      typeof data.invalidCount !== "number" || !Number.isInteger(data.invalidCount)) {
    return null;
  }

  return {
    date,
    playerId,
    playerName: normalizePlayerName(data.playerName),
    score: clampInteger(data.score, 0, 999_999),
    wordCount: clampInteger(data.wordCount, 0, 9_999),
    invalidCount: clampInteger(data.invalidCount, 0, 9_999),
    helpLevel: clampInteger(data.helpLevel, 0, 2),
    durationSeconds: clampInteger(data.durationSeconds, 0, 86_400),
    submittedAt: Date.now(),
  };
}

function normalizeDateKey(value: unknown) {
  const date = String(value ?? "").trim();

  return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : "";
}

function normalizePlayerId(value: unknown) {
  return String(value ?? "")
    .trim()
    .slice(0, 80);
}

function normalizePlayerName(value: unknown) {
  const name = String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 40);

  return name || "Joueur";
}

function clampInteger(value: unknown, min: number, max: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}
