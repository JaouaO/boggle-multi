// A1 : contrôles sans dépendance navigateur, intégrés à npm run check.
// Teste réellement les fonctions sensibles extraites du module d'interface.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const main = fs.readFileSync(new URL('../public/js/main.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../src/rooms/BoggleRoom.ts', import.meta.url), 'utf8');

function extract(start, end) {
  const i = main.indexOf(start);
  const j = main.indexOf(end, i + start.length);
  assert.ok(i >= 0 && j > i, `Fonction absente: ${start}`);
  return main.slice(i, j);
}

const homeFunction = extract('function refreshHomeVisibility() {', 'function getInitialRoomIdFromUrl()');
for (const [context, connected, playing, expected] of [
  ['daily', true, false, true], ['public', true, false, true],
  ['solo', true, false, false], ['private', true, false, false],
  ['solo', false, false, true], ['solo', true, true, true],
]) {
  const panel = { hidden: false };
  const ctx = {
    state: { gameContext: context, gameStatus: playing ? 'playing' : 'waiting' },
    document: { querySelector: () => panel },
    isSocketConnected: () => connected,
    isPublicRoomSessionV9K: () => context === 'public',
    syncPublicLegacyActionButtonsV9Q: () => {},
  };
  // Définition de GAME_CONTEXTS après l'appel : reproduit le bug TDZ précédent.
  vm.runInNewContext(`${homeFunction}\nrefreshHomeVisibility();\nconst GAME_CONTEXTS_V901={DAILY:'daily'};`, ctx);
  assert.equal(panel.hidden, expected, `Affichage lancement ${context}`);
}

const fnDaily = extract('function startRandomTimedGame() {', 'function startSolutionMode(');
const sent = [];
let prematureLock = false;
vm.runInNewContext(`${fnDaily}\nstartRandomTimedGame();`, {
  state: { gameContext: 'daily' },
  GAME_CONTEXTS_V901: { DAILY: 'daily' },
  isCurrentPlayerHost: () => true,
  rememberDailyAttemptStartedG6: () => { prematureLock = true; },
  send: (m) => sent.push(m),
  sanitizeGameOptionsForCurrentContextH3D: (opts) => opts,
  getGameOptions: () => ({ durationMode: 'timer' }),
  addLog: () => {}, logElement: null,
});
assert.equal(prematureLock, false, 'Ne pas verrouiller avant gameStarted');
assert.equal(sent.length, 1);
assert.equal(sent[0].type, 'startGame');
assert.ok(extract('function handleGameStarted(data) {', 'function handleGameEnded(data) {')
  .includes('rememberDailyAttemptStartedG6();'), 'Verrou au gameStarted');

const reconnectFns = extract('function cancelReconnectA1() {', 'function connectToRoom(options = {}) {');
let nextTimer = 1;
const timers = new Map();
let currentSession = { roomId: 'salon-1' };
let connectedCount = 0;
const ctx = {
  window: {
    setTimeout: (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    addEventListener: () => {},
  },
  document: { body: { classList: { contains: () => true } } },
  isSocketConnected: () => false,
  connectToRoom: () => { connectedCount++; },
};
vm.createContext(ctx);
vm.runInContext(`let activeSessionForReconnectA1 = { roomId: 'salon-1' };\nlet reconnectTimerA1 = 0;\nlet reconnectAttemptsA1 = 0;\nlet dailyRestartAfterReconnectA1 = false;\n${reconnectFns}\nscheduleReconnectA1(activeSessionForReconnectA1);`, ctx);
assert.equal(timers.size, 1);
assert.equal([...timers.values()][0].delay, 500);
const timer = [...timers.values()][0];
timers.clear(); timer.fn();
assert.equal(connectedCount, 1, 'Reconnexion après temporisation');
vm.runInContext('scheduleReconnectA1(activeSessionForReconnectA1);', ctx);
assert.equal([...timers.values()][0].delay, 1000, 'Temporisation progressive');
vm.runInContext('cancelReconnectA1();', ctx);
assert.equal(timers.size, 0, 'Retour accueil annule la reconnexion');
assert.ok(server.includes('this.sendPlayerProgressA1(ws);'), 'Envoi progression privée');
assert.ok(server.includes('foundWords: this.getPlayerFoundWords(attachment.foundWords)'),
  'Progression limitée au joueur authentifié');
console.log('[ok] A1 : accueil 6 états, verrou quotidien, reconnexion progressive, annulation, progression privée');
