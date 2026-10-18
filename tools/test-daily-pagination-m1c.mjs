// Test serveur M1c avec SQLite réel (Node >= 22) et TypeScript déjà présent dans le projet.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/rooms/DailyLeaderboard.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
runInNewContext(compiled, { exports, Request, Response, Headers, URL, URLSearchParams, Date, Math, Object, Number, String });
const { DailyLeaderboard } = exports;

function createLeaderboard(legacy = {}) {
  const db = new DatabaseSync(':memory:');
  const storage = new Map(Object.keys(legacy).length ? [['verifiedEntriesS3', legacy]] : []);
  const ctx = {
    storage: {
      sql: {
        exec(query, ...args) {
          if (!args.length && /^\s*CREATE /iu.test(query)) {
            db.exec(query);
            return { toArray: () => [] };
          }
          const stmt = db.prepare(query);
          if (/^\s*SELECT /iu.test(query)) return { toArray: () => stmt.all(...args) };
          stmt.run(...args);
          return { toArray: () => [] };
        },
      },
      get: async (key) => storage.get(key),
      put: async (key, value) => { storage.set(key, value); },
    },
    blockConcurrencyWhile(fn) { return fn(); },
  };
  return { object: new DailyLeaderboard(ctx), db, storage };
}
const baseUrl = 'https://boggle.test/?date=2026-10-18';
async function get(board, extra = '') {
  const url = baseUrl + (extra ? '&' + extra : '');
  const res = await board.fetch(new Request(url));
  assert.equal(res.status, 200);
  return res.json();
}
async function post(board, id, score, words = score) {
  const res = await board.fetch(new Request(baseUrl, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true, date: '2026-10-18', playerId: id,
      playerName: `Joueur ${id}`, score, wordCount: words, invalidCount: 0,
      durationSeconds: 180, helpLevel: 0 }),
  }));
  assert.equal(res.status, 200);
  return res.json();
}

// Contrat vide, pagination défensive.
{
  const { object } = createLeaderboard();
  const data = await get(object, 'page=999&pageSize=900');
  assert.equal(data.totalEntries, 0);
  assert.equal(data.totalPages, 1);
  assert.equal(data.page, 1);
  assert.equal(data.pageSize, 50);
  assert.deepEqual(data.pageEntries, []);
}

// 225 participants : aucun écrêtage au 200e, 10 premiers publics inchangés.
{
  const { object, db } = createLeaderboard();
  for (let i = 1; i <= 225; i++) await post(object, `user${String(i).padStart(4, '0')}`, i);
  const page1 = await get(object, 'page=1&playerId=user0001');
  assert.equal(page1.totalEntries, 225);
  assert.equal(page1.entries.length, 10);
  assert.equal(page1.pageEntries.length, 25);
  assert.equal(page1.totalPages, 9);
  assert.equal(page1.pageEntries[0].rank, 1);
  assert.equal(page1.pageEntries[0].score, 225);
  assert.equal(page1.playerRank, 225);
  assert.equal(page1.playerEntry.playerId, 'user0001');
  assert.ok(page1.entries.every((entry) => !('playerId' in entry)));
  assert.ok(page1.pageEntries.every((entry) => !('playerId' in entry)));
  const page9 = await get(object, 'page=9&playerId=user0001');
  assert.equal(page9.pageEntries[24].rank, 225);
  const pageBeyond = await get(object, 'page=999&pageSize=25');
  assert.equal(pageBeyond.page, 9);
  assert.equal(pageBeyond.pageEntries[24].score, 1);
  assert.equal((await post(object, 'user0001', 0)).stored, false);
  assert.equal((await post(object, 'user0001', 300)).stored, true);
  const updated = await get(object, 'playerId=user0001');
  assert.equal(updated.totalEntries, 225);
  assert.equal(updated.playerRank, 1);
  assert.equal(updated.entries[0].score, 300);
  assert.equal(db.prepare('SELECT count(*) AS n FROM verified_daily_scores_m1c').get().n, 225);
  db.close();
}

// Migration : conservation des entrées S3 sans duplication, et aucun effacement des clés.
{
  const legacy = {};
  for (let i = 0; i < 200; i++) {
    const id = `legacy${i}`;
    legacy[id] = { date: '2026-10-18', playerId: id, playerName: id, score: i,
      wordCount: i, invalidCount: 0, durationSeconds: 180, helpLevel: 0, submittedAt: i };
  }
  const { object, storage, db } = createLeaderboard(legacy);
  const initial = await get(object, 'page=8');
  assert.equal(initial.totalEntries, 200);
  assert.equal(initial.pageEntries.length, 25);
  assert.equal(storage.get('verifiedEntriesS3'), legacy);
  assert.equal(storage.get('verifiedEntriesMigratedM1C'), true);
  await post(object, 'newPlayer', 250);
  const newer = await get(object, 'playerId=newPlayer');
  assert.equal(newer.totalEntries, 201);
  assert.equal(newer.playerRank, 1);
  db.close();
}
console.log('[ok] M1c serveur : 225 scores, pages 25, top 10, rang personnel, migration S3, anti-écrêtage et identifiants privés');
