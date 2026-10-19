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
  waitingPracticeM2: { stop() {} },
  wordInput: { disabled: false },
  wordSubmitButton: { disabled: false },
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

// M2 : vérifier les imports ESM réels (une erreur de nom empêche tout démarrage).
const practiceModuleM2 = await import(new URL('../public/js/ui/waiting-practice-ui.js', import.meta.url));
assert.equal(typeof practiceModuleM2.createWaitingPractice, 'function');
assert.equal(practiceModuleM2.getWaitingPracticeGrids().length, 3);
console.log('[ok] M2 : graphe ESM charge et noms exportes valides');

// M2 : grilles-message réellement jouables, mais validation 100 % locale.
const practiceSrc = fs.readFileSync(new URL('../public/js/ui/waiting-practice-ui.js', import.meta.url), 'utf8');
const practiceDataSrc = fs.readFileSync(new URL('../public/js/ui/waiting-message-data.js', import.meta.url), 'utf8');
const practiceVm = {
  document: {
    body: { classList: { contains: (name) => name === 'v87-game-active' } },
    addEventListener: () => {},
  },
  normalizeComparableWord: (word) => String(word).toUpperCase(),
  renderBoard: (_element, _board, options) => { practiceVm.handlers = options; },
};
vm.createContext(practiceVm);
const practiceCode = practiceSrc.replace(/^import .*;\r?\n/gm, '').replace(/export (function|const) /g, '$1 ');
vm.runInContext(practiceDataSrc.replace(/export /g, ""), practiceVm);
vm.runInContext(practiceCode, practiceVm);
const fakeBoard = { querySelectorAll: () => [] };
const fakeInput = { disabled: true, value: '' };
const fakeSubmit = { disabled: true };
const fakeFeedback = { textContent: '' };
const fakeTimer = { textContent: '03:00' };
const practiceWords = [];
const practiceEffects = [];
const practice = practiceVm.createWaitingPractice({
  boardElement: fakeBoard, wordInput: fakeInput, wordSubmitButton: fakeSubmit,
  feedbackElement: fakeFeedback, timerElement: fakeTimer,
  onFoundWordsChange: (words) => practiceWords.push(words),
  onFeedback: (feedback) => practiceEffects.push(feedback),
});
const practiceGrids = practiceVm.getWaitingPracticeGrids();
assert.equal(practiceGrids.length, 3);
// Les mots du message sont décoratifs : la validation reste liée aux vrais
// chemins de lettres de la grille, pas aux mots écrits dans le message.
function isTraceableOnGrid(grid, word) {
  function visit(row, col, at, used) {
    if (row < 0 || row >= 4 || col < 0 || col >= 4 || used.has(`${row}:${col}`) ||
        grid.rows[row][col] !== word[at]) return false;
    if (at === word.length - 1) return true;
    const next = new Set([...used, `${row}:${col}`]);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if ((dr || dc) && visit(row+dr, col+dc, at+1, next)) return true;
    }
    return false;
  }
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    if (visit(row, col, 0, new Set())) return true;
  }
  return false;
}
assert.equal(practiceGrids[2].message, 'AMUSEZ-VOUS BIEN');
assert.deepEqual([...practiceGrids[2].rows].join(''), 'AMUSEZVOUSBIEN__');
for (const grid of practiceGrids) {
  assert.equal(grid.rows.length, 4);
  assert.ok(grid.rows.every((row) => row.length === 4));
  assert.ok(grid.words.length >= 20, 'Un échauffement propose plusieurs mots');
  assert.ok(grid.words.every((word) => isTraceableOnGrid(grid, word)),
    'Aucun mot impossible ne figure dans les listes de validation');
}

practice.start({roomId: 'practice-room', context: 'private'});
assert.equal(practice.isActive(), true);
assert.equal(fakeTimer.textContent, 'Sans chrono');
assert.equal(fakeInput.disabled, false);
assert.equal(fakeSubmit.disabled, false);
assert.equal(practiceVm.handlers.canClickCells, true);
const exampleWord = practiceGrids.reduce((entry, grid) => grid === practiceGrids[0] ? grid : entry, null).words[0];
// Une entrée issue du vrai dictionnaire est validée localement ; aucune requête serveur.
const activeWords = practiceGrids[[...'practice-room'].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3].words;
fakeInput.value = activeWords[0];
assert.equal(practice.submit(fakeInput.value), true);
assert.match(fakeFeedback.textContent, /trouvé/);
assert.equal(practiceWords.at(-1).length, 1, 'Le mot apparaît dans Mots trouvés');
assert.equal(practiceWords.at(-1)[0].word, activeWords[0]);
assert.equal(practiceWords.at(-1)[0].points, 0, 'Aucun point officiel');
assert.equal(practiceEffects.at(-1).type, 'accepted');
assert.ok(practiceEffects.at(-1).path.length >= 3, 'Effet sur les vraies cases du mot');
practice.submit(activeWords[0]);
assert.match(fakeFeedback.textContent, /déjà trouvé/);
assert.equal(practiceWords.at(-1).length, 1, 'Doublon sans nouvelle ligne');
assert.equal(practiceEffects.at(-1).type, 'duplicate');
practice.submit('ZZZZZZZZ');
assert.match(fakeFeedback.textContent, /ne figure pas/);
assert.equal(practiceEffects.at(-1).type, 'invalid');
// Cliquez sur une case, puis une case adjacente (pas de reset à chaque clic).
practiceVm.handlers.onCellClick({ row: 0, col: 0, letter: practiceGrids[0].rows[0][0] });
assert.equal(fakeInput.value.length, 1);
practiceVm.handlers.onCellClick({ row: 0, col: 1, letter: practiceGrids[0].rows[0][1] });
assert.equal(fakeInput.value.length, 2);
fakeInput.value = 'MOTENATTENTE';
practice.stop();
assert.equal(practice.isActive(), false);
assert.equal(practiceWords.at(-1).length, 0, 'Mots d’échauffement effacés pour la vraie manche');
assert.equal(fakeInput.value, '', 'Le mot d’entraînement ne fuit pas dans la vraie partie');
assert.ok(!practiceSrc.includes('sendMessage(') && !practiceSrc.includes('fetch('), 'Entraînement hors ligne');
assert.ok(main.includes('waitingPracticeM2.stop();'), 'Fin officielle arrête l’entraînement');
assert.ok(main.includes('waitingPracticeM2.submit(wordInput.value)'), 'Le formulaire attend son verdict local');
assert.ok(main.includes('onFoundWordsChange: (words) => renderFoundWords(foundWordsElement, words, { practice: true })'),
  'Réutiliser le rendu habituel de Mots trouvés');
assert.ok(main.includes('onFeedback: ({ type, label, path }) => runSubmissionFeedback(wordForm'),
  'Réutiliser les sons et effets configurés par le joueur');
assert.ok(main.includes('points.textContent = isPractice ? "—" : String(score)'),
  'Ne pas afficher de faux points en échauffement');
console.log('[ok] M2 : trois grilles-message, saisie, validation locale, doublons, fin de session, aucun score serveur');


// M3a : les trois cartes sont des actions de navigation, sans panneau générique.
// Le sélecteur global CSS `section` ajoute un fond et une bordure non désirés.
const homeMarkupM3a = extract('function setupHomeScreenV87() {', 'setupHomeScreenV87();');
assert.ok(homeMarkupM3a.includes('<nav class="home-v87-modes" aria-label="Modes de jeu">'),
  'Les cartes d’accueil doivent être regroupées dans une navigation');
assert.ok(!homeMarkupM3a.includes('<section class="home-v87-modes"'),
  'Ne pas réintroduire le conteneur section encadré par les styles globaux');
assert.ok(homeMarkupM3a.includes("'</nav>',"), 'Navigation des cartes correctement fermée');
assert.equal((homeMarkupM3a.match(/data-home-action="(?:public|private|solo)"/g) || []).length, 3,
  'Les trois boutons de mode doivent être conservés');
console.log('[ok] M3a : accueil sans encadrement parasite, trois cartes et navigation conservées');

// M3b : le statut en attente masque le chrono officiel et le bouton d'arret.
// Le lancement de la vraie manche doit restaurer le chrono, sans modifier ses calculs.
const controlsM3b = extract('function updateHostControls() {', 'function renderPlayersWithHostBadges(');
const statusM3b = extract('function updateGameStatus(status) {', '/* V87-HOME-SCREEN START */');
const timerM3b = { textContent: '03:00', hidden: false };
const stopM3b = { hidden: false, disabled: false, title: '' };
const startM3b = { hidden: false, disabled: false, title: '' };
const fakeStateM3b = {gameStatus: 'waiting', gameContext: 'private', playerId:'me', roomId:'room'};
const noopM3b = () => {};
const ctxM3b = {
  state: fakeStateM3b,
  GAME_CONTEXTS_V901: { DAILY: 'daily' }, DEFAULT_DURATION_SECONDS: 180,
  DEFAULT_GAME_OPTIONS: {durationMode:'timer'},
  timerElement: timerM3b, endGameButton: stopM3b, startButton: startM3b,
  gameStatusElement: {textContent:''}, boardElement: {innerHTML:''},
  wordInput: {disabled:false}, wordSubmitButton: {disabled:false},
  foundWordsElement:{}, wordFeedbackElement:{},
  waitingPracticeM2: {start:noopM3b, stop:noopM3b},
  isCurrentPlayerHost: () => true,
  isPublicRoomSessionV9K: () => false,
  canStartGameNowG3: () => true,
  hasDailyAttemptLockG6: () => false,
  syncPublicLegacyActionButtonsV9Q: noopM3b,
  stopCountdownWarning: noopM3b, stopLocalTimer: noopM3b,
  hideEndScreenOverlay: noopM3b, hideEndScreen:noopM3b,
  renderFoundWords: noopM3b, setWordFeedback:noopM3b,
  refreshHelpDisplay:noopM3b, renderMousePanel:noopM3b,
  renderRulesSummary:noopM3b, refreshHomeVisibility:noopM3b,
  refreshRightRulesPanel:noopM3b, renderModePanel:noopM3b,
  renderTimer: (el, sec) => {el.textContent = `0${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;},
};
vm.createContext(ctxM3b);
vm.runInContext(`${controlsM3b}\n${statusM3b}\nresetGameUiToWaiting();`, ctxM3b);
assert.equal(timerM3b.hidden, true, 'Chrono officiel masque au demarrage');
assert.equal(stopM3b.hidden, true, 'Terminer masque avant lancement');
vm.runInContext('updateGameStatus("playing");', ctxM3b);
assert.equal(timerM3b.hidden, false, 'Chrono officiel restaure lors du lancement');
assert.equal(stopM3b.hidden, false, 'Hote peut terminer une vraie partie');
vm.runInContext('updateGameStatus("waiting");', ctxM3b);
assert.equal(timerM3b.hidden, true, 'Chrono masque lors de la manche suivante en attente');
assert.equal(stopM3b.hidden, true, 'Arret masque lors de la manche suivante en attente');
vm.runInContext('updateGameStatus("ended");', ctxM3b);
assert.equal(stopM3b.hidden, true, 'Arret masque apres la fin');
const cssM3b = fs.readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
assert.match(cssM3b, /#play-status-panel :is\(#timer, #end-game\)\[hidden\]\s*\{\s*display:\s*none\s*!important;/,
  'L attribut hidden doit prevaloir sur les boutons affiches par CSS');
console.log('[ok] M3b : attente sans chrono officiel ni bouton arret, chrono restaure au lancement');

// M3c : libellés quotidiens fondés sur l'heure de fin confirmée par le serveur.
// Revenir sur la page ne doit ni remettre le chrono à zéro ni permettre une nouvelle tentative.
const dailyHomeFnsM3C = extract('// M3c : état lisible de la grille quotidienne', '/* S7 : conserver la date');
const dailyStoreM3C = new Map();
const todayM3C = '2026-10-19';
const dailyLabelM3C = { textContent: 'Jouer' };
const dailyAttrsM3C = new Map();
const dailyButtonM3C = {
  querySelector: (sel) => sel === '[data-daily-action-label-m3c]' ? dailyLabelM3C : null,
  setAttribute: (key, value) => dailyAttrsM3C.set(key, value),
};
let dailyTimerIdM3C = 0;
const dailyTimersM3C = new Map();
const dailyEventsM3C = new Map();
const dailyContextM3C = {
  window: {
    localStorage: {
      getItem: (key) => dailyStoreM3C.has(key) ? dailyStoreM3C.get(key) : null,
      setItem: (key, value) => dailyStoreM3C.set(key, value),
    },
    setTimeout: (fn, delay) => { const id = ++dailyTimerIdM3C; dailyTimersM3C.set(id, {fn, delay}); return id; },
    clearTimeout: (id) => dailyTimersM3C.delete(id),
    addEventListener: (name, fn) => dailyEventsM3C.set(name, fn),
  },
  document: {
    querySelector: (sel) => sel === '#home-v87 [data-home-action="daily"]' ? dailyButtonM3C : null,
    addEventListener: (name, fn) => dailyEventsM3C.set(name, fn),
    hidden: false,
  },
  state: {gameContext: 'daily'},
  GAME_CONTEXTS_V901: {DAILY:'daily'},
  getDailyDateKeyG6: () => todayM3C,
  getActiveDailyRoomIdentityS7: () => ({date:todayM3C}),
  Date,
};
vm.createContext(dailyContextM3C);
vm.runInContext(`let dailyHomeActionTimerM3C = null;\n${dailyHomeFnsM3C}`, dailyContextM3C);
const labelM3C = (date, now) => vm.runInContext(`getDailyHomeActionLabelM3C(${JSON.stringify(date)}, ${now})`, dailyContextM3C);
const nowM3C = Date.now();
assert.equal(labelM3C(todayM3C, nowM3C), 'Jouer', 'Première visite sans tentative');
dailyStoreM3C.set(`boggle:daily-attempt:${todayM3C}`, 'started');
assert.equal(labelM3C(todayM3C, nowM3C), 'Reprendre', 'Ancien verrou sans métadonnée : récupérer la session');
vm.runInContext(`rememberDailyDeadlineM3C(${nowM3C - 60_000}, 180)`, dailyContextM3C);
assert.equal(Number(dailyStoreM3C.get(`boggle:daily-deadline:${todayM3C}`)), nowM3C + 120_000);
assert.equal(labelM3C(todayM3C, nowM3C), 'Reprendre', 'Temps restant conservé après une sortie');
assert.equal(labelM3C(todayM3C, nowM3C + 121_000), 'Voir le classement', 'Le délai expire même hors du jeu');
assert.equal(dailyLabelM3C.textContent, 'Reprendre');
assert.match(dailyAttrsM3C.get('aria-label'), /sans pause/);
assert.equal(dailyTimersM3C.size, 1, 'Un seul rafraîchissement programmé');
assert.equal(labelM3C('2026-10-20', nowM3C + 86_400_000), 'Jouer', 'Nouvelle journée, nouvelle tentative');
// Un résultat terminé avant son échéance est définitivement terminé.
vm.runInContext(`rememberDailyDeadlineM3C(${nowM3C - 60_000}, 180, ${nowM3C - 5_000})`, dailyContextM3C);
assert.equal(labelM3C(todayM3C, nowM3C), 'Voir le classement');
assert.equal(dailyLabelM3C.textContent, 'Voir le classement');
assert.equal(dailyTimersM3C.size, 1, 'Pas de minuteries concurrentes');
// Les mutations provenant d'un deuxième onglet mettent l'accueil à jour.
dailyStoreM3C.delete(`boggle:daily-attempt:${todayM3C}`);
dailyEventsM3C.get('storage')({key:`boggle:daily-attempt:${todayM3C}`});
assert.equal(dailyLabelM3C.textContent, 'Jouer');
assert.ok(main.replaceAll('\r\n', '\n').includes('refreshDailyHomeActionM3C();\n  void refreshHomeDailyLeaderboardS2();'),
  'Retour accueil / chargement actualisent le bouton');
assert.ok(extract('function handleGameStarted(data) {', 'function handleGameEnded(data) {')
  .includes('rememberDailyDeadlineM3C(data.startedAt, data.durationSeconds);'));
assert.ok(extract('function handleGameEnded(data) {', 'function refreshRightRulesPanel() {')
  .includes('rememberDailyDeadlineM3C(data.startedAt, data.durationSeconds, data.endedAt);'));
const timerSourceM3C = fs.readFileSync(new URL('../public/js/ui/timer-ui.js', import.meta.url), 'utf8');
assert.ok(timerSourceM3C.includes('Date.now() - startedAt'), 'Chrono calculé sur le temps réel, pas la session ouverte');
assert.ok(server.includes('await this.ctx.storage.setAlarm(gameEndAt);'), 'Alarme serveur indépendante du client');
assert.ok(server.includes('await this.endGameIfNeeded();'), 'Session réouverte : état de fin recontrôlé');
console.log('[ok] M3c : jouer/reprendre/classement, heure serveur, expiration hors page, minuit et multi-onglet');
