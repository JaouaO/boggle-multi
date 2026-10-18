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
// M1c : SQLite conserve chaque score vérifié, sans évincer les joueurs hors top 200.
// Les deux clés historiques sont conservées pour permettre une migration non destructive.
const LEGACY_STORAGE_KEY = "verifiedEntriesS3";
const MIGRATION_KEY = "verifiedEntriesMigratedM1C";
const PUBLIC_TOP_LIMIT = 10; // Contrat existant : accueil et modale inchangés.
const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;
const SORT_ORDER = `score DESC, word_count DESC, invalid_count ASC,
                    duration_seconds ASC, submitted_at ASC, player_id ASC`;

type StoredRow = {
  playerId: string;
  playerName: string;
  score: number;
  wordCount: number;
  invalidCount: number;
  helpLevel: number;
  durationSeconds: number;
  submittedAt: number;
};

export class DailyLeaderboard {
  private readonly ready: Promise<void>;

  constructor(private readonly ctx: DurableObjectState) {
    this.ready = ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS verified_daily_scores_m1c (
          player_id TEXT PRIMARY KEY NOT NULL,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          word_count INTEGER NOT NULL,
          invalid_count INTEGER NOT NULL,
          help_level INTEGER NOT NULL,
          duration_seconds INTEGER NOT NULL,
          submitted_at INTEGER NOT NULL
        )
      `);
      ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS verified_daily_scores_rank_m1c
        ON verified_daily_scores_m1c (${SORT_ORDER})
      `);
      // La clé S3 ne contenait que les 200 meilleurs scores. On récupère ceux qui
      // existent encore une fois, sans écraser d'éventuels scores déjà migrés.
      if (await ctx.storage.get<boolean>(MIGRATION_KEY)) return;
      const previous = await ctx.storage.get<Record<string, DailyLeaderboardEntry>>(LEGACY_STORAGE_KEY);
      for (const entry of Object.values(previous ?? {})) {
        ctx.storage.sql.exec(`
          INSERT OR IGNORE INTO verified_daily_scores_m1c
          (player_id, player_name, score, word_count, invalid_count, help_level, duration_seconds, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, entry.playerId, entry.playerName, entry.score, entry.wordCount,
          entry.invalidCount, entry.helpLevel, entry.durationSeconds, entry.submittedAt);
      }
      await ctx.storage.put(MIGRATION_KEY, true);
    });
  }

  async fetch(request: Request): Promise<Response> {
    await this.ready;
    const url = new URL(request.url);
    const date = normalizeDateKey(
      request.headers.get("X-Daily-Leaderboard-Date") ?? url.searchParams.get("date")
    );
    if (!date) return json({ ok: false, error: "date invalide" }, { status: 400 });
    if (request.method === "GET") return this.handleGet(date, url);
    if (request.method === "POST") return this.handlePost(date, request);
    return json({ ok: false, error: "méthode non autorisée" }, { status: 405 });
  }

  private handleGet(date: string, url: URL) {
    const playerId = normalizePlayerId(url.searchParams.get("playerId"));
    const page = parsePage(url.searchParams.get("page"));
    const pageSize = parsePageSize(url.searchParams.get("pageSize"));
    return json(this.buildResponse(date, playerId, page, pageSize));
  }

  private async handlePost(date: string, request: Request) {
    const payload = await readJsonBody(request);
    // Le Worker envoie uniquement un résultat vérifié par la salle de jeu.
    const entry = normalizeSubmission(date, payload);
    if (!entry) return json({ ok: false, error: "score invalide" }, { status: 400 });

    const previous = this.readPlayer(entry.playerId, date);
    const stored = !previous || shouldReplaceEntry(entry, previous);
    if (stored) {
      this.ctx.storage.sql.exec(`
        INSERT INTO verified_daily_scores_m1c
        (player_id, player_name, score, word_count, invalid_count, help_level, duration_seconds, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_id) DO UPDATE SET
          player_name = excluded.player_name,
          score = excluded.score,
          word_count = excluded.word_count,
          invalid_count = excluded.invalid_count,
          help_level = excluded.help_level,
          duration_seconds = excluded.duration_seconds,
          submitted_at = excluded.submitted_at
      `, entry.playerId, entry.playerName, entry.score, entry.wordCount,
        entry.invalidCount, entry.helpLevel, entry.durationSeconds, entry.submittedAt);
    }
    return json({ ...this.buildResponse(date, entry.playerId, 1, PAGE_SIZE), stored });
  }

  private readPlayer(playerId: string, date: string): DailyLeaderboardEntry | null {
    const rows = this.ctx.storage.sql.exec<StoredRow>(`
      SELECT player_id AS playerId, player_name AS playerName, score,
             word_count AS wordCount, invalid_count AS invalidCount,
             help_level AS helpLevel, duration_seconds AS durationSeconds,
             submitted_at AS submittedAt
      FROM verified_daily_scores_m1c WHERE player_id = ?
    `, playerId).toArray();
    return rows[0] ? { ...rows[0], date } : null;
  }

  private readPage(date: string, limit: number, offset: number) {
    const rows = this.ctx.storage.sql.exec<StoredRow>(`
      SELECT player_id AS playerId, player_name AS playerName, score,
             word_count AS wordCount, invalid_count AS invalidCount,
             help_level AS helpLevel, duration_seconds AS durationSeconds,
             submitted_at AS submittedAt
      FROM verified_daily_scores_m1c ORDER BY ${SORT_ORDER}
      LIMIT ? OFFSET ?
    `, limit, offset).toArray();
    return rows.map((entry, index) => ({ ...entry, date, rank: offset + index + 1 }));
  }

  private readPlayerRank(date: string, playerId: string): RankedDailyLeaderboardEntry | null {
    if (!playerId) return null;
    const rows = this.ctx.storage.sql.exec<StoredRow & { rank: number }>(`
      SELECT * FROM (
        SELECT player_id AS playerId, player_name AS playerName, score,
               word_count AS wordCount, invalid_count AS invalidCount,
               help_level AS helpLevel, duration_seconds AS durationSeconds,
               submitted_at AS submittedAt,
               ROW_NUMBER() OVER (ORDER BY ${SORT_ORDER}) AS rank
        FROM verified_daily_scores_m1c
      ) WHERE playerId = ?
    `, playerId).toArray();
    return rows[0] ? { ...rows[0], date } : null;
  }

  private buildResponse(date: string, playerId: string, requestedPage: number, pageSize: number) {
    const count = this.ctx.storage.sql.exec<{ total: number }>(
      "SELECT COUNT(*) AS total FROM verified_daily_scores_m1c"
    ).toArray()[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const topEntries = this.readPage(date, PUBLIC_TOP_LIMIT, 0).map(publicEntry);
    const pageEntries = this.readPage(date, pageSize, (page - 1) * pageSize).map(publicEntry);
    const playerEntry = this.readPlayerRank(date, playerId);
    return {
      ok: true, date, totalEntries: count,
      entries: topEntries, // Ne pas modifier le comportement S2/H9b/M1b.
      pageEntries, page, pageSize, totalPages,
      playerEntry, playerRank: playerEntry?.rank ?? null,
    };
  }
}

function publicEntry({ playerId: _privateId, ...entry }: RankedDailyLeaderboardEntry) {
  return entry;
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return value && /^\d{1,7}$/.test(value) && Number.isSafeInteger(parsed)
    ? Math.max(1, parsed) : 1;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);
  return value && /^\d{1,3}$/.test(value) && Number.isSafeInteger(parsed)
    ? Math.max(1, Math.min(MAX_PAGE_SIZE, parsed)) : PAGE_SIZE;
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
