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

// M1a : toutes les voies du logo réutilisent la navigation Accueil existante.
const navigateHomeFn = extract('function navigateHomeViaGlobalActionV908L() {', 'function ensureGlobalHomeButtonV908L() {');
for (const [screen, expected] of [['private', 'private'], ['public', 'public'], ['game', 'game'], ['home', 'none']]) {
  const calls = [];
  vm.runInNewContext(`${navigateHomeFn.slice(0, navigateHomeFn.indexOf('// Les logos natifs'))}\nnavigateHomeViaGlobalActionV908L();`, {
    getCurrentGlobalScreenV908L: () => screen,
    showHomeFromPrivateV89: () => calls.push('private'),
    showHomeFromPublicV88: () => calls.push('public'),
    returnToHomeV87: () => calls.push('game'),
    syncGlobalActionsBarV908L: () => calls.push('sync'),
  });
  assert.equal(calls[0] === 'sync' ? 'none' : calls[0], expected, `Navigation logo ${screen}`);
  assert.equal(calls.at(-1), 'sync', `Barre d’actions actualisée ${screen}`);
}
assert.ok(main.includes('document.addEventListener("click", handleLogoHomeClickV908L);'));
assert.ok(main.includes('data-home-logo aria-label="Retour à l’accueil"'));
const layout = fs.readFileSync(new URL('../public/js/ui/layout-ui.js', import.meta.url), 'utf8');
assert.ok(layout.includes('brand = document.createElement("a")'));
console.log('[ok] M1a : logo accessible, retour accueil commun et scénarios de navigation');

// M1b : la modale est temporaire ; le même écran reste accessible après fermeture.
const endUi = fs.readFileSync(new URL('../public/js/ui/end-screen-ui.js', import.meta.url), 'utf8');
const sourceClasses = new Set();
const bodyClasses = new Set();
const sourcePanel = {
  hidden: true,
  classList: { add: (name) => sourceClasses.add(name), remove: (name) => sourceClasses.delete(name) },
  removeAttribute: () => {}, setAttribute: () => {}, contains: () => false,
};
const m1bContext = {
  state: { gameStatus: 'ended' },
  document: {
    body: { classList: { add: (name) => bodyClasses.add(name), remove: (name) => bodyClasses.delete(name) } },
    querySelector: (selector) => selector.startsWith('#end-screen') ? sourcePanel : null,
    addEventListener: () => {},
  },
};
vm.createContext(m1bContext);
vm.runInContext(extract('function handleEndResultsActionM1B(', 'function renderVictoryModalV16() {'), m1bContext);
vm.runInContext('showInlineEndResultsM1B();', m1bContext);
assert.equal(sourcePanel.hidden, false, 'Panneau permanent visible en fin de partie');
assert.ok(sourceClasses.has('boggle-end-inline-m1b'));
assert.ok(bodyClasses.has('boggle-results-inline-m1b'));
const uiHide = endUi.slice(endUi.indexOf('export function hideEndScreen() {'), endUi.indexOf('function ensureEndScreen(')).replace('export function', 'function');
vm.runInContext(`${uiHide}\nhideEndScreen();`, m1bContext);
assert.equal(sourcePanel.hidden, true, 'Ancien écran masqué à la manche suivante');
assert.ok(!bodyClasses.has('boggle-results-inline-m1b'), 'Plateau rétabli après masquage');
assert.ok(!sourceClasses.has('boggle-end-inline-m1b'));

const closePopup = extract('function closeEndScreenPopup() {', 'function handleEndScreenDialogKeydownH9D(');
let restored = 0;
vm.runInNewContext(`let endScreenReturnFocusH9D = null;\n${closePopup}\ncloseEndScreenPopup();`, {
  state: { gameStatus: 'ended', endScreenVisible: true },
  rememberDismissedEndScreenV9H: () => {},
  hideEndScreenOverlay: () => {},
  showInlineEndResultsM1B: () => { restored++; },
  hideEndScreen: () => { throw Error('Ne pas cacher les résultats à la fermeture'); },
  document: { querySelector: (selector) => selector.includes('#end-screen') ?
    { hidden: false, focus: () => {} } : null },
});
assert.equal(restored, 1);
assert.ok(main.replaceAll('\r\n','\n').includes('if (state.gameStatus === "ended") {\n    renderCurrentEndScreen();\n  }'),
  'Actualiser les résultats même quand la modale est fermée');
assert.ok(endUi.includes('sortedPlayers.slice(0, 5)'), 'Classement limité au top cinq');
assert.ok(endUi.includes('personalIndex >= 5'), 'Résultat personnel hors top cinq');
console.log('[ok] M1b : résultats persistants, retour au plateau, fermeture modale, top 5 + vous');

// M1b / reprise quotidienne : retour sur une tentative bloquée = classement
// vérifié par GET, sans POST ni faux zéro de statistiques.
const dailyHistoryFns = extract('// M1b : relecture de la grille quotidienne déjà lancée,', 'function getDailyLeaderboardEndScreenStateH9B() {');
let allowDailyLock = true;
let fetchResult = {ok: true, json: async () => ({
  ok: true, date: '2026-10-17', totalEntries: 12,
  playerRank: 8, playerEntry: {rank: 8, playerId: 'mine', score: 42, wordCount: 9},
  entries: [{rank: 1, score: 90, wordCount: 20}],
})};
const historyCalls = [];
const historyRenders = [];
const historyState = {gameContext: 'daily', gameStatus: 'waiting', roomId: 'grille-du-jour-2026-10-17-abcxyz001',playerId:'mine'};
const historyCtx = {
  state: historyState,
  DAILY_LEADERBOARD_API_H9B: '/api/daily-leaderboard',
  GAME_CONTEXTS_V901: { DAILY: 'daily' },
  URLSearchParams,
  getOrCreateClientId: () => 'mine',
  clearDailyPageM1C2: () => {},
  getDailyPageForEndScreenM1C2: (date) => ({status: "idle", data: null, date}),
  getDailyDateKeyG6: () => '2026-10-17',
  getActiveDailyRoomIdentityS7: () => ({date:'2026-10-17'}),
  hasDailyAttemptLockG6: () => allowDailyLock,
  renderEndScreen: (_, args) => historyRenders.push(args),
  boardElement: {},
  gameStatusElement: {textContent:'En attente de lancement'},
  timerElement: {textContent:'03:00'},
  showInlineEndResultsM1B: () => historyCalls.push('inline'),
  fetch: async (url, options) => {
    assert.ok(url.startsWith('/api/daily-leaderboard?date=2026-10-17&playerId=mine'));
    assert.equal(options, undefined, 'Le repli de classement est un GET, jamais un POST');
    historyCalls.push('fetch');
    return fetchResult;
  },
};
vm.createContext(historyCtx);
vm.runInContext(dailyHistoryFns, historyCtx);
const flushHistory = () => new Promise((resolve) => setImmediate(resolve));
allowDailyLock = false;
vm.runInContext('openDailyHistoryFallbackM1B();', historyCtx);
assert.equal(historyCalls.length, 0, 'Aucun fallback sans tentative quotidienne commencée');
allowDailyLock = true;
vm.runInContext('openDailyHistoryFallbackM1B();', historyCtx);
await flushHistory();
assert.equal(historyCalls.filter((x) => x === 'fetch').length, 1);
assert.equal(historyRenders.at(-1).dailyHistoryOnly, true);
assert.equal(historyRenders.at(-1).dailyLeaderboard.data.playerEntry.score, 42);
assert.ok(historyCalls.includes('inline'));
assert.equal(historyCtx.gameStatusElement.textContent, 'Grille du jour déjà jouée');
assert.equal(historyState.gameStatus, 'waiting', 'Ne pas forcer une fausse fin de partie');

// Un historique absent affiche tout de même les autres joueurs.
fetchResult = {ok:true,json:async()=>({ok:true,date:'2026-10-17',entries:[{rank:1,score:95}],totalEntries:8,playerEntry:null,playerRank:null})};
await vm.runInContext('refreshDailyHistoryFallbackM1B();',historyCtx);
assert.equal(historyRenders.at(-1).dailyLeaderboard.status,'loaded');
assert.equal(historyRenders.at(-1).dailyLeaderboard.data.playerEntry,null);

// API inaccessible : écran et bouton Réessayer disponibles.
fetchResult={ok:false,json:async()=>({ok:false})};
await vm.runInContext('refreshDailyHistoryFallbackM1B();',historyCtx);
assert.equal(historyRenders.at(-1).dailyLeaderboard.status,'error');

// Réponse tardive : ne jamais réafficher le fallback après reprise du vrai jeu.
let delayedResolve;
historyCtx.fetch=()=>new Promise((resolve)=>{delayedResolve=resolve;});
const pending = vm.runInContext('refreshDailyHistoryFallbackM1B();',historyCtx);
vm.runInContext('clearDailyHistoryFallbackM1B();',historyCtx);
const countBefore=historyRenders.length;
delayedResolve({ok:true,json:async()=>({ok:true,date:'2026-10-17',entries:[]})});
await pending;
assert.equal(historyRenders.length,countBefore);
assert.ok(main.includes('  openDailyHistoryFallbackM1B();'), 'Retour quotidien appelle le fallback');
assert.ok(main.includes('    if (data.status === "waiting" && state.gameContext === GAME_CONTEXTS_V901.DAILY)'),
  'La réponse waiting serveur restaure le fallback');
assert.ok(endUi.includes('dailyHistoryOnly'), 'Le rendu existant gère le classement historique');
assert.ok(endUi.includes('data-daily-history-retry-m1b'), 'Réessayer le GET et non le POST');
console.log('[ok] M1b reprise quotidienne : score récupéré, classement sans score, erreur, GET, réponse périmée');

// M1c2 : GET paginé du panneau central ; le résultat personnel est toujours conservé.
const pageFnsM1C2 = extract('// M1c2 : pagination du classement central seulement.', '// M1b : relecture de la grille quotidienne déjà lancée,');
let pageFetchM1C2 = async () => { throw new Error('fetch non configuré'); };
let renderedM1C2 = 0;
const pageBaseDataM1C2 = {
  ok: true, date: '2026-10-17', totalEntries: 225, playerRank: 218,
  playerEntry: {rank: 218, score: 4, wordCount: 4},
  entries: Array.from({length: 10}, (_, i) => ({rank: i+1, score: 225-i})),
  pageEntries: Array.from({length:25}, (_,i)=>({rank:i+1,score:225-i})),
  page:1, pageSize:25, totalPages:9,
};
const contextM1C2 = {
  state: { gameContext: 'daily', gameStatus: 'ended', roomId: 'daily-room' },
  GAME_CONTEXTS_V901: {DAILY:'daily'},
  getDailyDateKeyG6: ()=> '2026-10-17',
  getActiveDailyRoomIdentityS7: ()=>({date:'2026-10-17'}),
  getOrCreateClientId: ()=> 'mine',
  renderCurrentEndScreen: ()=> { renderedM1C2++; },
  renderDailyHistoryFallbackM1B: ()=> { renderedM1C2++; },
  URLSearchParams,
  document: {querySelector: () => ({focus: () => {}})},
  fetch: (...args)=>pageFetchM1C2(...args),
  DAILY_LEADERBOARD_API_H9B:'/api/daily-leaderboard',
};
vm.createContext(contextM1C2);
vm.runInContext(`let dailyHistoryFallbackM1B = false;
let dailyHistoryLeaderboardM1B = {status:'idle',data:null};
let dailyLeaderboardStateH9B = {status:'loaded',data:${JSON.stringify(pageBaseDataM1C2)}};
${pageFnsM1C2}`, contextM1C2);
assert.equal(vm.runInContext('getDailyPageForEndScreenM1C2("2026-10-17").status',contextM1C2),'idle');
let requestedM1C2 = [];
pageFetchM1C2 = async (url, options)=> {
  assert.equal(options,undefined,'Classement demandé par GET seulement');
  const params = new URL(url,'https://boggle.test').searchParams;
  const n = Number(params.get('page'));
  requestedM1C2.push(n);
  assert.equal(params.get('date'),'2026-10-17');
  assert.equal(params.get('playerId'),'mine');
  assert.equal(params.get('pageSize'),'25');
  return {ok:true,json:async()=>({...pageBaseDataM1C2,page:n,pageEntries:[{rank:(n-1)*25+1,score:5}]})};
};
await vm.runInContext('changeDailyLeaderboardPageM1C2("next")',contextM1C2);
assert.equal(requestedM1C2.at(-1),2);
assert.equal(vm.runInContext('dailyPageStateM1C2.data.page',contextM1C2),2);
await vm.runInContext('changeDailyLeaderboardPageM1C2("mine")',contextM1C2);
assert.equal(requestedM1C2.at(-1),9,'Aller directement à la page de notre rang');
assert.equal(vm.runInContext('dailyPageStateM1C2.data.pageEntries[0].rank',contextM1C2),201);
await vm.runInContext('changeDailyLeaderboardPageM1C2("next")',contextM1C2);
assert.equal(requestedM1C2.length,2,'Pas de dépassement après la dernière page');
pageFetchM1C2= async ()=>({ok:false,json:async()=>({ok:false})});
await vm.runInContext('changeDailyLeaderboardPageM1C2("previous")',contextM1C2);
assert.equal(vm.runInContext('dailyPageStateM1C2.status',contextM1C2),'error');
assert.equal(vm.runInContext('dailyPageStateM1C2.data.page',contextM1C2),9,'Échec conserve la page précédente');
pageFetchM1C2=async (url)=>({ok:true,json:async()=>({...pageBaseDataM1C2,page:8,pageEntries:[]})});
await vm.runInContext('changeDailyLeaderboardPageM1C2("retry")',contextM1C2);
assert.equal(vm.runInContext('dailyPageStateM1C2.data.page',contextM1C2),8,'Nouvel essai de la page échouée');
let resolveLateM1C2;
pageFetchM1C2=()=>new Promise((resolve)=>{resolveLateM1C2=resolve;});
const pendingM1C2=vm.runInContext('changeDailyLeaderboardPageM1C2("previous")',contextM1C2);
vm.runInContext('clearDailyPageM1C2()',contextM1C2);
const rendersBeforeLateM1C2=renderedM1C2;
resolveLateM1C2({ok:true,json:async()=>({...pageBaseDataM1C2,page:7})});
await pendingM1C2;
assert.equal(renderedM1C2,rendersBeforeLateM1C2,'Réponse tardive ignorée après changement de partie');
assert.equal(vm.runInContext('dailyPageStateM1C2.status',contextM1C2),'idle');
assert.ok(main.includes('if (container.id === "end-screen") void changeDailyLeaderboardPageM1C2'),
  'Modale non paginée : événements réservés au panneau central');
assert.ok(endUi.includes('daily && !panelElement ? dailyPage : null'),
  'Le panneau et la modale se partagent une source avec deux politiques de classement');
assert.ok(endUi.includes('boggle-daily-scroll-m1c2'), 'Liste centrale déroulante');
console.log('[ok] M1c2 : pages 25, aller à mon rang, limite, erreur/reprise, anti-réponse tardive, modale intacte');
