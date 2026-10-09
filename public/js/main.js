import { state } from "./core/state.js";
import { createRoomSocket, sendMessage } from "./net/socket.js";
import { renderBoard } from "./ui/board-ui.js";
import { addLog } from "./ui/log-ui.js";
import { setWordFeedback } from "./ui/words-ui.js";
import {
  renderTimer,
  startLocalTimer,
  stopLocalTimer,
} from "./ui/timer-ui.js";
import { renderHelpPanel } from "./ui/help-ui.js";
import {
  hideEndScreen,
  renderEndScreen,
} from "./ui/end-screen-ui.js";
import {
  getGameOptions,
  renderModeControls,
  renderPlayerPreferencesPanel,
} from "./ui/mode-ui.js";
import { renderMouseInputPanel } from "./ui/mouse-input-ui.js";
import { setupAppLayout } from "./ui/layout-ui.js";
import { runSubmissionFeedback } from "./ui/feedback-ui.js";
import { applyThemeStyles } from "./ui/theme-styles.js";

const DEFAULT_DURATION_SECONDS = 180;
const DEFAULT_GAME_OPTIONS = {
  durationMode: "timer",
  durationSeconds: DEFAULT_DURATION_SECONDS,
  boardSize: 4,
  uniqueWords: false,
  penalizeInvalidWords: false,
  invalidWordPenalty: 1,
  maxHelpLevel: 3,
  targetScoreMode: "percentOfMaxScore",
  targetScorePercent: 70,
  targetScore: 50,
  soundEnabled: true,
  masterVolume: 0.65,
  visualEffectsEnabled: true,
};

let pendingSubmissionPath = [];
let foundWordHoverTimer = null;
let countdownWarningInterval = null;
let lastCountdownTickSecond = null;
let countdownAudioContext = null;

const STORAGE_KEYS = {
  playerName: "boggle:playerName",
  lastRoomId: "boggle:lastRoomId",
  playerPreferences: "boggle:playerPreferences",
  clientId: "boggle:clientId",
};

const roomInput = document.querySelector("#room");
const nameInput = document.querySelector("#name");
const connectButton = document.querySelector("#connect");
const startButton = document.querySelector("#start");
const statusElement = document.querySelector("#status");
const gameStatusElement = document.querySelector("#game-status");
const timerElement = document.querySelector("#timer");
const playersElement = document.querySelector("#players");
const boardElement = document.querySelector("#board");
const logElement = document.querySelector("#log");
const wordForm = document.querySelector("#word-form");
const wordInput = document.querySelector("#word-input");
const wordSubmitButton = document.querySelector("#word-submit");
const wordFeedbackElement = document.querySelector("#word-feedback");
const foundWordsElement = document.querySelector("#found-words");

roomInput.placeholder = "Room";
roomInput.setAttribute("aria-label", "Room");
nameInput.placeholder = "Pseudo";
nameInput.setAttribute("aria-label", "Pseudo");

const endGameButton = document.createElement("button");
endGameButton.id = "end-game";
endGameButton.type = "button";
endGameButton.className = "ui-button danger-button";
endGameButton.textContent = "Terminer la partie";
endGameButton.hidden = true;
endGameButton.style.background = "#b42318";
endGameButton.style.color = "#fff";
endGameButton.style.border = "2px solid #7f1d1d";
endGameButton.style.borderRadius = "0.75rem";
endGameButton.style.fontWeight = "900";
endGameButton.style.padding = "0.58rem 0.9rem";
endGameButton.addEventListener("click", () => {
  if (!window.confirm("Terminer la partie ?")) {
    return;
  }

  send({
    type: "endGame",
  });
});

const inviteRoomButton = document.createElement("button");
inviteRoomButton.id = "copy-room-link";
inviteRoomButton.type = "button";
inviteRoomButton.textContent = "Copier le lien de la room";
inviteRoomButton.hidden = true;
inviteRoomButton.addEventListener("click", copyRoomInviteLink);


const connectionStatusLine = document.createElement("div");
connectionStatusLine.id = "connection-status-line";
connectionStatusLine.className = "connection-status-wrapper";
connectionStatusLine.style.display = "flex";
connectionStatusLine.style.alignItems = "center";
connectionStatusLine.style.gap = "0.5rem";
connectionStatusLine.style.flexWrap = "wrap";
connectionStatusLine.style.margin = "0.5rem 0";

// Inséré après setupAppLayout(), sinon la mise en page sépare les libellés des champs.


timerElement.insertAdjacentElement("afterend", endGameButton);

const rulesSummaryElement = document.createElement("section");
rulesSummaryElement.id = "rules-summary";
rulesSummaryElement.hidden = true;
rulesSummaryElement.style.display = "flex";
rulesSummaryElement.style.flexWrap = "wrap";
rulesSummaryElement.style.gap = "0.35rem";
rulesSummaryElement.style.margin = "0";
rulesSummaryElement.style.padding = "0";
rulesSummaryElement.style.border = "0";
rulesSummaryElement.style.background = "transparent";
gameStatusElement.insertAdjacentElement("afterend", rulesSummaryElement);

const welcomePanel = createWelcomePanel();
boardElement.insertAdjacentElement("beforebegin", welcomePanel);

applyThemeStyles();


function setupConnectionFields() {
  statusElement.classList.add("info-badge", "info-badge-strong", "connected-badge");
  statusElement.hidden = true;
  statusElement.textContent = "Connecté";

  inviteRoomButton.hidden = true;
  connectionStatusLine.hidden = true;
}

connectButton.addEventListener("click", connectToRoom);
startButton.addEventListener("click", startRandomTimedGame);
wordForm.addEventListener("submit", submitWord);
wordInput.addEventListener("input", handleKeyboardWordInput);
document.addEventListener("pointerup", handleGlobalPointerUp);
window.addEventListener("resize", scheduleBoardFitV31);
window.addEventListener("orientationchange", scheduleBoardFitV31);
roomInput.addEventListener("input", () => {
  updateInviteButton();
  saveLocalString(STORAGE_KEYS.lastRoomId, roomInput.value.trim());
});
nameInput.addEventListener("input", () => {
  saveLocalString(STORAGE_KEYS.playerName, nameInput.value.trim());
});

const savedSettings = loadLocalSettings();
const initialRoomId = getInitialRoomIdFromUrl();

if (savedSettings.playerName) {
  nameInput.value = savedSettings.playerName;
}

if (initialRoomId) {
  roomInput.value = initialRoomId;
} else if (savedSettings.lastRoomId) {
  roomInput.value = savedSettings.lastRoomId;
}

state.playerPreferences = {
  ...state.playerPreferences,
  ...savedSettings.playerPreferences,
};

startButton.textContent = "Lancer une grille aléatoire";
updateInviteButton();

renderModePanel();

renderMouseInputPanel(wordForm, {
  word: "",
  onSubmit: submitSelectedWord,
  onClear: clearSelectedLetters,
});

setupAppLayout();
setupConnectionFields();
scheduleBoardFitV31();
renderPlayerPreferences();
refreshRightRulesPanel();

resetGameUiToWaiting();
refreshHomeVisibility();

function createWelcomePanel() {
  const panel = document.createElement("section");
  panel.id = "welcome-panel";
  panel.setAttribute("aria-label", "Accueil avant connexion");

  const welcomeBoard = document.createElement("div");
  welcomeBoard.className = "welcome-board";
  welcomeBoard.setAttribute("aria-hidden", "true");

  renderBoard(welcomeBoard, buildWelcomeGrid(), {
    canClickCells: false,
  });

  const caption = document.createElement("p");
  caption.className = "welcome-caption";
  caption.textContent = "Connectez-vous à une room pour lancer ou rejoindre une partie.";

  panel.append(welcomeBoard, caption);

  return panel;
}

function buildWelcomeGrid() {
  return [
    ["C", "O", "N", "N", "E"],
    ["C", "T", "E", "Z", ""],
    ["V", "O", "U", "S", ""],
    ["A", "", "U", "N", "E"],
    ["R", "O", "O", "M", ""],
  ];
}

function isSocketConnected() {
  return Boolean(state.socket) && state.socket.readyState === WebSocket.OPEN;
}

function refreshHomeVisibility() {
  const connected = isSocketConnected();
  const gameActive = state.gameStatus === "playing";
  const launchPanel = document.querySelector("#launch-panel");

  welcomePanel.hidden = connected || gameActive;

  if (launchPanel) {
    launchPanel.hidden = !connected || gameActive;
  }
}

function loadLocalSettings() {
  return {
    playerName: readLocalString(STORAGE_KEYS.playerName),
    lastRoomId: readLocalString(STORAGE_KEYS.lastRoomId),
    playerPreferences: readLocalJson(STORAGE_KEYS.playerPreferences, {}),
  };
}

function getOrCreateClientId() {
  forgetSharedClientId();

  const savedClientId = readSessionString(STORAGE_KEYS.clientId);

  if (savedClientId) {
    return savedClientId;
  }

  const clientId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  saveSessionString(STORAGE_KEYS.clientId, clientId);
  return clientId;
}

function forgetSharedClientId() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.clientId);
  } catch {
    // Le stockage local peut être indisponible en navigation privée.
  }
}

function readSessionString(key) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveSessionString(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Le stockage de session peut être indisponible en navigation privée.
  }
}

function readLocalString(key) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function readLocalJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalString(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Le stockage local peut être indisponible en navigation privée.
  }
}

function saveLocalJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Le stockage local peut être indisponible en navigation privée.
  }
}

function getInitialRoomIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const roomId = url.searchParams.get("room");

    return roomId ? roomId.trim().slice(0, 60) : "";
  } catch {
    return "";
  }
}

function getCurrentRoomIdForInvite() {
  return (state.roomId || roomInput.value.trim() || "TEST").trim();
}

function createRoomInviteUrl(roomId = getCurrentRoomIdForInvite()) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

function updateRoomUrl(roomId) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    window.history.replaceState(null, "", url);
  } catch {
    // Le lien copiable reste disponible même si l'URL ne peut pas être mise à jour.
  }
}

function updateInviteButton() {
  const isConnected =
    Boolean(state.socket) && state.socket.readyState === WebSocket.OPEN;

  connectionStatusLine.hidden = true;
  statusElement.hidden = !isConnected;
  statusElement.textContent = "Connecté";
  inviteRoomButton.hidden = true;
  refreshHomeVisibility();
}

async function copyRoomInviteLink() {
  const inviteUrl = createRoomInviteUrl();

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(inviteUrl);
      addLog(logElement, `[système] Lien de room copié : ${inviteUrl}`);
    } else {
      window.prompt("Copiez ce lien d’invitation :", inviteUrl);
      addLog(logElement, "[système] Lien de room affiché.");
    }

    inviteRoomButton.textContent = "Lien copié";
    window.setTimeout(() => {
      inviteRoomButton.textContent = "Copier le lien de la room";
    }, 1400);
  } catch {
    window.prompt("Copiez ce lien d’invitation :", inviteUrl);
    addLog(logElement, "[système] Copie automatique impossible, lien affiché.");
  }
}

function handleGlobalPointerUp(event) {
  if (!state.isDraggingLetters) {
    return;
  }

  const target = event.target;

  if (target instanceof Element && target.closest(".board-cell")) {
    return;
  }

  finishCurrentDragSelection();
}

function finishCurrentDragSelection() {
  if (!state.isDraggingLetters) {
    return;
  }

  const draggedWord = pathToWord(state.dragPath);
  const wasDragSelection = state.dragMoved;

  state.isDraggingLetters = false;
  state.suppressNextCellClick = true;

  if (wasDragSelection && draggedWord.length >= 3) {
    state.selectedPath = [...state.dragPath];
    state.selectedWord = draggedWord;
    submitSelectedWord();
    state.dragPath = [];
    state.dragMoved = false;
    return;
  }

  state.dragPath = [];
  state.dragMoved = false;

  updateWordInputFromPath(state.selectedPath);
  renderCurrentBoardWithHelp();
  renderMousePanel();
}

function submitWord(event) {
  event.preventDefault();

  const word = wordInput.value.trim();

  if (!word) {
    return;
  }

  pendingSubmissionPath = getSubmissionPathForTypedWord(word);

  if (!pendingSubmissionPath.length) {
    flashKeyboardWordImpossible();
  }

  send({
    type: "submitWord",
    word,
  });

  wordInput.value = "";
  clearSelectedLetters();
  wordInput.focus();
}

function submitSelectedWord() {
  if (!state.selectedWord || state.selectedWord.length < 3) {
    return;
  }

  pendingSubmissionPath = [...state.selectedPath];

  send({
    type: "submitWord",
    word: state.selectedWord,
  });

  wordInput.value = "";
  clearSelectedLetters();
}

function handleKeyboardWordInput() {
  if (state.gameStatus !== "playing" || !state.board || state.isDraggingLetters) {
    return;
  }

  const word = wordInput.value.trim();

  state.selectedPath = [];
  state.selectedWord = "";
  state.keyboardPreviewPath = [];
  state.hoveredFoundWordPath = [];
  state.dragPath = [];
  state.dragMoved = false;
  state.suppressNextCellClick = false;

  if (!word) {
    state.keyboardPreviewPath = [];
    renderCurrentBoardWithHelp();
    return;
  }

  state.keyboardPreviewPath = findBoardPathForWord(word);
  renderCurrentBoardWithHelp();
}

function getSubmissionPathForTypedWord(word) {
  if (
    state.selectedPath.length > 0 &&
    state.selectedWord &&
    normalizeComparableWord(state.selectedWord) === normalizeComparableWord(word)
  ) {
    return [...state.selectedPath];
  }

  if (
    state.keyboardPreviewPath?.length > 0 &&
    normalizeComparableWord(pathToWord(state.keyboardPreviewPath)) === normalizeComparableWord(word)
  ) {
    return [...state.keyboardPreviewPath];
  }

  return findBoardPathForWord(word);
}

function findBoardPathForWord(word) {
  const target = normalizeComparableWord(word);

  if (!state.board || !target) {
    return [];
  }

  const rows = state.board.length;
  const cols = state.board[0]?.length ?? 0;

  if (!rows || !cols) {
    return [];
  }

  function visit(row, col, index, used, path) {
    if (row < 0 || col < 0 || row >= rows || col >= cols) {
      return null;
    }

    const key = `${row}:${col}`;

    if (used.has(key)) {
      return null;
    }

    const letter = normalizeComparableWord(state.board[row]?.[col] ?? "");

    if (!letter || !target.startsWith(letter, index)) {
      return null;
    }

    const nextIndex = index + letter.length;
    const nextPath = [
      ...path,
      {
        row,
        col,
        letter: state.board[row][col],
      },
    ];

    if (nextIndex === target.length) {
      return nextPath;
    }

    if (nextIndex > target.length) {
      return null;
    }

    const nextUsed = new Set(used);
    nextUsed.add(key);

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        if (rowOffset === 0 && colOffset === 0) {
          continue;
        }

        const result = visit(
          row + rowOffset,
          col + colOffset,
          nextIndex,
          nextUsed,
          nextPath
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const result = visit(row, col, 0, new Set(), []);

      if (result) {
        return result;
      }
    }
  }

  return [];
}



function flashKeyboardWordImpossible() {
  wordInput.classList.remove("boggle-keyboard-word-impossible");
  void wordInput.offsetWidth;
  wordInput.classList.add("boggle-keyboard-word-impossible");

  window.setTimeout(() => {
    wordInput.classList.remove("boggle-keyboard-word-impossible");
  }, 260);
}


function normalizeComparableWord(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .toUpperCase();
}

function takePendingSubmissionPath() {
  const path = pendingSubmissionPath;
  pendingSubmissionPath = [];
  return path;
}

function connectToRoom() {
  const roomId = roomInput.value.trim() || "TEST";
  const playerName = nameInput.value.trim() || "joueur";
  const clientId = getOrCreateClientId();

  saveLocalString(STORAGE_KEYS.lastRoomId, roomId);
  saveLocalString(STORAGE_KEYS.playerName, playerName);

  if (
    state.socket &&
    state.roomId === roomId &&
    (state.socket.readyState === WebSocket.CONNECTING ||
      state.socket.readyState === WebSocket.OPEN)
  ) {
    addLog(logElement, `[système] Vous êtes déjà connecté à la room ${roomId}.`);
    return;
  }

  if (state.socket) {
    state.socket.close();
  }

  stopLocalTimer();
  resetGameUiToWaiting();

  state.roomId = roomId;
  state.playerName = playerName;
  updateRoomUrl(roomId);
  updateInviteButton();

  const { socket, url } = createRoomSocket(roomId);
  state.socket = socket;
  renderRulesSummary();

  socket.addEventListener("open", () => {
    if (state.socket !== socket) {
      return;
    }

    statusElement.hidden = false;
    statusElement.textContent = "Connecté";
    updateInviteButton();
    updateHostControls();
    renderRulesSummary();

    addLog(logElement, `Connecté à ${url}`);

    send({
      type: "join",
      name: playerName,
      clientId,
    });
  });

  socket.addEventListener("message", (event) => {
    if (state.socket !== socket) {
      return;
    }

    const data = JSON.parse(event.data);
    handleServerMessage(data);
  });

  socket.addEventListener("close", () => {
    if (state.socket !== socket) {
      return;
    }

    statusElement.textContent = "Déconnecté";
    state.socket = null;
    updateInviteButton();
    startButton.disabled = true;
    renderRulesSummary();
    stopLocalTimer();
    addLog(logElement, "Connexion fermée.");
  });

  socket.addEventListener("error", () => {
    if (state.socket !== socket) {
      return;
    }

    addLog(logElement, "Erreur WebSocket.");
  });
}

function startRandomTimedGame() {
  if (!isCurrentPlayerHost()) {
    addLog(logElement, "[système] Seul l’hébergeur de la salle peut lancer une partie.");
    return;
  }

  send({
    type: "startGame",
    mode: "timed",
    options: getGameOptions(),
  });
}

function startSolutionMode(board) {
  if (!isCurrentPlayerHost()) {
    addLog(logElement, "[système] Seul l’hébergeur de la salle peut lancer une partie.");
    return;
  }

  saveLastBoardSuggestion(board);

  send({
    type: "startGame",
    mode: "solution",
    board,
    options: {
      ...getGameOptions(),
      boardSize: board.length,
      durationMode: "noTimer",
    },
  });
}


function saveLastBoardSuggestion(board) {
  const text = formatBoardForTextarea(board);

  if (!text) {
    return;
  }

  try {
    window.localStorage.setItem("boggle:lastBoardText", text);
  } catch {
    // La persistance est un confort : on ignore les blocages navigateur.
  }

  const textarea = document.querySelector("#custom-board");

  if (textarea instanceof HTMLTextAreaElement) {
    textarea.value = text;
  }
}

function formatBoardForTextarea(board) {
  if (typeof board === "string") {
    return normalizeBoardTextForTextarea(board);
  }

  if (!Array.isArray(board)) {
    return "";
  }

  return normalizeBoardTextForTextarea(
    board
      .map((row) => Array.isArray(row) ? row.join("") : String(row || ""))
      .filter(Boolean)
      .join("\n")
  );
}

function normalizeBoardTextForTextarea(value) {
  return String(value || "")
    .trim()
    .replace(/\s*[\\/|;]+\s*/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, "").toUpperCase())
    .filter(Boolean)
    .join("\n");
}

function syncPendingGameOptions(options) {
  if (!isCurrentPlayerHost() || state.gameStatus === "playing") {
    return;
  }

  state.gameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...options,
  };

  send({
    type: "updateGameOptions",
    options: state.gameOptions,
  });

  renderRulesSummary();
  refreshRightRulesPanel();
}

function send(data) {
  const sent = sendMessage(state.socket, data);

  if (!sent) {
    addLog(logElement, "Socket non connectée.");
  }
}

function isCurrentPlayerHost() {
  return state.players.some(
    (player) => player.id === state.playerId && player.isHost
  );
}

function updateHostControls() {
  const isHost = isCurrentPlayerHost();
  const canStartGame =
    Boolean(state.socket) && state.gameStatus !== "playing" && isHost;
  const canEndGame = state.gameStatus === "playing" && isHost;

  startButton.hidden = state.gameStatus === "playing";
  startButton.disabled = !canStartGame;
  startButton.title = canStartGame
    ? "Lancer une grille aléatoire"
    : "Seul l’hébergeur de la salle peut lancer une partie.";

  endGameButton.hidden = !canEndGame;
  endGameButton.disabled = !canEndGame;
  endGameButton.title = canEndGame
    ? "Terminer la partie"
    : "Seul l’hébergeur de la salle peut terminer la partie.";

  if (state.gameStatus !== "playing") {
    renderModePanel();
  }
}

function renderPlayersWithHostBadges(element, players) {
  const previousScrollTop = element.scrollTop;
  element.innerHTML = "";

  if (!players.length) {
    element.textContent = "Aucun joueur connecté.";
    return;
  }

  const rankedPlayers = rankPlayers(players);

  const list = document.createElement("ul");
  list.className = "players-scroll-list";

  for (const [index, player] of rankedPlayers.entries()) {
    list.append(createPlayerRow(player, index + 1));
  }

  element.append(list);
  element.scrollTop = Math.min(previousScrollTop, element.scrollHeight);
}

function rankPlayers(players) {
  return [...players].sort((a, b) => {
    const scoreDiff = Number(b.score ?? 0) - Number(a.score ?? 0);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const wordDiff = Number(b.wordCount ?? 0) - Number(a.wordCount ?? 0);

    if (wordDiff !== 0) {
      return wordDiff;
    }

    return String(a.name ?? "").localeCompare(String(b.name ?? ""), "fr");
  });
}

function createPlayerRow(player, rank) {
  const item = document.createElement("li");
  item.className = player.id === state.playerId
    ? "player-row player-row-current"
    : "player-row";
  item.style.display = "flex";
  item.style.justifyContent = "space-between";
  item.style.alignItems = "center";
  item.style.gap = "0.22rem";

  const nameLine = document.createElement("span");
  nameLine.className = "player-name-line";
  nameLine.style.display = "flex";
  nameLine.style.alignItems = "center";
  nameLine.style.gap = "0.18rem";
  nameLine.style.flexWrap = "nowrap";

  const rankElement = document.createElement("span");
  rankElement.className = "player-rank";
  rankElement.textContent = `${rank}.`;

  const name = document.createElement("strong");
  name.textContent = player.name;
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";
  name.style.whiteSpace = "nowrap";

  nameLine.append(rankElement, name);

  const badges = document.createElement("span");
  badges.className = "player-badges";

  if (player.id === state.playerId) {
    const selfBadge = createPlayerBadge("Vous");
    selfBadge.style.background = "rgba(90, 59, 35, 0.08)";
    selfBadge.style.color = "#5a3b23";
    badges.append(selfBadge);
  }

  if (player.isHost) {
    const hostBadge = createPlayerBadge("Hôte");
    hostBadge.style.background = "#5a3b23";
    hostBadge.style.color = "#fff8ea";
    badges.append(hostBadge);
  }

  if (badges.childElementCount) {
    nameLine.append(badges);
  }

  const scoreLine = document.createElement("span");
  scoreLine.className = "player-score-line";
  scoreLine.textContent = `${Number(player.score ?? 0)} pt · ${Number(player.wordCount ?? 0)} mot`;

  item.append(nameLine, scoreLine);

  return item;
}

function createPlayerBadge(label) {
  const badge = document.createElement("span");
  badge.textContent = label;
  badge.className = "info-badge compact-badge";
  badge.style.lineHeight = "1";

  return badge;
}

function handleServerMessage(data) {
  if (data.type === "connected") {
    state.playerId = data.playerId;
    state.selectedFoundWordsPlayerId = data.playerId;
    statusElement.hidden = false;
    statusElement.textContent = "Connecté";
    refreshHomeVisibility();
    updateHostControls();
    renderRulesSummary();
    refreshRightRulesPanel();
    addLog(logElement, `Room connectée : ${data.roomId}`);
    return;
  }

  if (data.type === "system") {
    addLog(logElement, `[système] ${data.text}`);
    return;
  }

  if (data.type === "players") {
    state.players = data.players;

    ensureSelectedFoundWordsPlayer();
    renderFoundWords(foundWordsElement, state.foundWords);
    renderPlayersWithHostBadges(playersElement, data.players);
    updateHostControls();
    renderRulesSummary();
    refreshRightRulesPanel();

    if (state.endScreenVisible) {
      renderCurrentEndScreen();
    }

    return;
  }

  if (data.type === "gameOptionsUpdated") {
    state.gameOptions = {
      ...DEFAULT_GAME_OPTIONS,
      ...data.gameOptions,
    };

    renderModePanel();
    renderRulesSummary();
    refreshRightRulesPanel();
    return;
  }

  if (data.type === "gameStatus") {
    updateGameStatus(data.status);
    return;
  }

  if (data.type === "gameStarted") {
    handleGameStarted(data);
    return;
  }

  if (data.type === "gameEnded") {
    handleGameEnded(data);
    return;
  }

  if (data.type === "wordAccepted") {
    handleWordAccepted(data);
    return;
  }

  if (data.type === "wordRejected") {
    handleWordRejected(data);
    return;
  }

  if (data.type === "solutionsStats") {
    handleSolutionsStats(data);
    return;
  }

  addLog(logElement, `Message serveur inconnu : ${JSON.stringify(data)}`);
}


function ensureSelectedFoundWordsPlayer() {
  if (!canSelectFoundWordsPlayer()) {
    state.selectedFoundWordsPlayerId = state.playerId || "";
    return;
  }

  const players = state.players || [];

  if (!players.length) {
    state.selectedFoundWordsPlayerId = state.playerId || "";
    return;
  }

  if (
    state.selectedFoundWordsPlayerId &&
    players.some((player) => player.id === state.selectedFoundWordsPlayerId)
  ) {
    return;
  }

  const self = players.find((player) => player.id === state.playerId) || players[0];
  state.selectedFoundWordsPlayerId = self.id;
}


function renderFoundWords(element, words, options = {}) {
  element.innerHTML = "";
  element.style.minHeight = "0";
  element.style.overflowY = "auto";
  element.style.overflowX = "hidden";
  element.style.overscrollBehavior = "contain";
  element.style.paddingRight = "0.35rem";
  element.style.boxSizing = "border-box";
  element.style.display = "block";
  element.style.flex = "1 1 auto";
  element.style.maxHeight = "none";

  const viewer = document.createElement("div");
  viewer.className = "found-words-viewer";

  const canSelectPlayer = canSelectFoundWordsPlayer();
  const selectedPlayer = canSelectPlayer ? getSelectedFoundWordsPlayer() : null;
  const displayedWords = canSelectPlayer
    ? getFoundWordsForSelectedPlayer(selectedPlayer)
    : normalizeFoundWordsForDisplay(words);
  const totalScore = displayedWords.reduce(
    (total, item) => total + Number(item.points ?? 0),
    0
  );
  const invalidCount = canSelectPlayer
    ? getInvalidCountForSelectedPlayer(selectedPlayer)
    : Number(state.invalidCount ?? 0);

  if (canSelectPlayer) {
    viewer.append(createFoundWordsPlayerTabs(selectedPlayer));
  }

  const summary = document.createElement("div");
  summary.className = "found-words-summary";

  const summaryLabel = document.createElement("span");
  summaryLabel.textContent = canSelectPlayer && selectedPlayer
    ? `${selectedPlayer.id === state.playerId ? "Vous" : selectedPlayer.name}`
    : "Vos mots";

  const summaryScore = document.createElement("strong");
  summaryScore.textContent =
    `${displayedWords.length} mot${displayedWords.length > 1 ? "s" : ""}` +
    ` · ${totalScore} pt${totalScore > 1 ? "s" : ""}` +
    ` · ${invalidCount} faute${invalidCount > 1 ? "s" : ""}`;

  summary.append(summaryLabel, summaryScore);
  viewer.append(summary);

  const table = document.createElement("div");
  table.className = "found-words-table";

  for (const label of ["Mot", "Pts"]) {
    const header = document.createElement("span");
    header.className = "found-words-header-cell";
    header.textContent = label;
    table.append(header);
  }

  if (!displayedWords.length) {
    const empty = document.createElement("span");
    empty.className = "found-words-empty-row";
    empty.textContent = canSelectPlayer
      ? "Aucun mot pour ce joueur."
      : "Aucun mot trouvé pour le moment.";
    table.append(empty);
    viewer.append(table);
    element.append(viewer);
    return;
  }

  for (const item of [...displayedWords].reverse()) {
    const row = document.createElement("div");
    row.className = `found-words-row found-word-score-${getFoundWordScoreClass(item.points)}`;

    if (Array.isArray(item.path) && item.path.length) {
      row.classList.add("has-hover-path");
      bindFoundWordHover(row, item.path);
    }

    const word = document.createElement("span");
    word.className = "found-words-word";

    const dot = document.createElement("span");
    dot.className = "found-word-dot";
    dot.setAttribute("aria-hidden", "true");

    const label = document.createElement("strong");
    label.textContent = item.word;

    word.append(dot, label);

    const points = document.createElement("span");
    points.className = "found-words-points";
    const score = Number(item.points ?? 0);
    points.textContent = String(score);

    row.append(word, points);
    table.append(row);
  }

  viewer.append(table);
  element.append(viewer);
  element.scrollTop = 0;
}

function bindFoundWordHover(row, path) {
  row.addEventListener("mouseenter", () => {
    window.clearTimeout(foundWordHoverTimer);
    foundWordHoverTimer = window.setTimeout(() => {
      state.hoveredFoundWordPath = normalizeFoundWordPath(path);
      renderCurrentBoardWithHelp();
    }, 500);
  });

  row.addEventListener("mouseleave", () => {
    window.clearTimeout(foundWordHoverTimer);
    foundWordHoverTimer = null;

    if (state.hoveredFoundWordPath.length) {
      state.hoveredFoundWordPath = [];
      renderCurrentBoardWithHelp();
    }
  });
}

function normalizeFoundWordPath(path) {
  return [...(path || [])]
    .map((cell) => ({
      row: Number(cell.row),
      col: Number(cell.col),
      letter: state.board?.[Number(cell.row)]?.[Number(cell.col)] ?? "",
    }))
    .filter((cell) => Number.isInteger(cell.row) && Number.isInteger(cell.col));
}

function getInvalidCountForSelectedPlayer(player) {
  if (!player) {
    return 0;
  }

  if (typeof player.invalidCount === "number") {
    return player.invalidCount;
  }

  if (player.id === state.playerId) {
    return Number(state.invalidCount ?? 0);
  }

  return 0;
}

function getFoundWordScoreClass(points) {
  const score = Number(points ?? 0);

  if (score >= 11) {
    return "11";
  }

  if (score >= 5) {
    return "5";
  }

  if (score >= 3) {
    return "3";
  }

  if (score >= 2) {
    return "2";
  }

  return "1";
}

function canSelectFoundWordsPlayer() {
  return state.gameStatus === "ended" || state.gameMode === "solution";
}

function getSelectedFoundWordsPlayer() {
  const players = rankPlayers(state.players || []);

  if (!players.length) {
    return null;
  }

  if (
    state.selectedFoundWordsPlayerId &&
    players.some((player) => player.id === state.selectedFoundWordsPlayerId)
  ) {
    return players.find((player) => player.id === state.selectedFoundWordsPlayerId);
  }

  const self = players.find((player) => player.id === state.playerId) || players[0];
  state.selectedFoundWordsPlayerId = self.id;
  return self;
}

function getFoundWordsForSelectedPlayer(player) {
  if (!player) {
    return [];
  }

  if (Array.isArray(player.foundWords)) {
    return normalizeFoundWordsForDisplay(player.foundWords);
  }

  if (player.id === state.playerId) {
    return normalizeFoundWordsForDisplay(state.foundWords);
  }

  return [];
}

function normalizeFoundWordsForDisplay(words) {
  return [...(words || [])]
    .map((item) => ({
      word: String(item.word || "").toUpperCase(),
      points: Number(item.points ?? 0),
      path: Array.isArray(item.path) ? item.path : [],
    }))
    .filter((item) => item.word);
}

function createFoundWordsPlayerTabs(selectedPlayer) {
  const tabs = document.createElement("div");
  tabs.className = "found-words-player-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Choisir les mots d’un joueur");

  for (const player of rankPlayers(state.players || [])) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "found-words-player-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(player.id === selectedPlayer?.id));
    button.textContent = `${player.id === state.playerId ? "Vous" : player.name} (${Number(player.score ?? 0)} pts)`;

    button.addEventListener("click", () => {
      state.selectedFoundWordsPlayerId = player.id;
      state.hoveredFoundWordPath = [];
      renderFoundWords(foundWordsElement, state.foundWords);
      renderCurrentBoardWithHelp();
    });

    tabs.append(button);
  }

  return tabs;
}

function handleWordAccepted(data) {
  const feedbackPath = takePendingSubmissionPath();

  state.score = data.score;
  state.foundWords = [
    ...state.foundWords,
    {
      word: data.word,
      points: data.points,
      path: feedbackPath,
    },
  ];

  state.selectedFoundWordsPlayerId = state.playerId || state.selectedFoundWordsPlayerId;
  renderFoundWords(foundWordsElement, state.foundWords);
  const acceptedPoints = Number(data.points ?? 0);

  setWordFeedback(
    wordFeedbackElement,
    `Mot valide +${acceptedPoints} point${acceptedPoints > 1 ? "s" : ""}`
  );

  clearSelectedLetters();
  refreshHelpDisplay();
  refreshRightRulesPanel();
  renderCurrentBoardWithHelp();

  runSubmissionFeedback(wordForm, {
    type: "accepted",
    label: `+${data.points}`,
    options: state.playerPreferences,
    boardElement,
    path: feedbackPath,
  });
}

function handleWordRejected(data) {
  const feedbackPath = takePendingSubmissionPath();

  if (typeof data.score === "number") {
    state.score = data.score;
  }

  if (typeof data.invalidCount === "number") {
    state.invalidCount = data.invalidCount;
  }

  const feedbackType = data.reasonCode === "invalid" ? "invalid" : "duplicate";
  const penalty = Number(data.penalty ?? 0);
  const label = penalty ? `-${penalty}` : "!";

  const alreadyTriedInvalid =
    feedbackType === "invalid" && !penalty && String(data.reason || "").includes("Déjà tenté");

  setWordFeedback(
    wordFeedbackElement,
    feedbackType === "invalid"
      ? alreadyTriedInvalid
        ? "Mot invalide déjà tenté"
        : `Mot invalide${penalty ? ` -${penalty} point${penalty > 1 ? "s" : ""}` : ""}`
      : "Déjà trouvé"
  );

  refreshRightRulesPanel();

  runSubmissionFeedback(wordForm, {
    type: feedbackType,
    label,
    options: state.playerPreferences,
    boardElement,
    path: feedbackPath,
  });
}


function getCurrentTargetScore() {
  if (!state.solutionsStats) {
    return null;
  }

  if (state.gameOptions.targetScoreMode === "fixedScore") {
    return state.gameOptions.targetScore;
  }

  return Math.max(
    1,
    Math.ceil(
      (state.solutionsStats.maxScore * state.gameOptions.targetScorePercent) / 100
    )
  );
}

function renderTargetScoreStatus() {
  if (state.gameOptions.durationMode !== "targetScore") {
    return;
  }

  const targetScore = getCurrentTargetScore();

  if (!targetScore) {
    timerElement.textContent = "Objectif";
    return;
  }

  timerElement.textContent = `Objectif ${targetScore} points`;
}

function handleSolutionsStats(data) {
  state.solutionsStats = data;
  state.solutionCellWords = data.cellWords || [];

  refreshHelpDisplay();

  if (state.board) {
    renderCurrentBoardWithHelp();
  }

  renderTargetScoreStatus();
  renderRulesSummary();
  refreshRightRulesPanel();

  if (state.endScreenVisible) {
    renderCurrentEndScreen();
  }

  addLog(
    logElement,
    `Solutions calculées : ${data.totalWords} mot(s), ${data.maxScore} point(s) max, calcul en ${data.solveDurationMs} ms.`
  );
}

function handleBoardCellClick({ row, col, letter }) {
  if (state.suppressNextCellClick) {
    state.suppressNextCellClick = false;
    return;
  }

  if (state.gameStatus !== "playing") {
    return;
  }

  addClickedLetterToSelection({ row, col, letter });
}

function handleCellHelpClick() {
  // L'ancien niveau "aide par lettre" est désactivé.
}

function handleCellPointerDown({ row, col, letter }) {
  if (state.gameStatus !== "playing") {
    return;
  }

  state.isDraggingLetters = true;
  state.dragMoved = false;
  state.dragPath = [{ row, col, letter }];

  updateWordInputFromPath(state.dragPath);
  renderCurrentBoardWithHelp();
  renderMousePanel();
}

function handleCellPointerEnter({ row, col, letter }) {
  addCellToDragPath({ row, col, letter });
}

function handleCellPointerMove({ row, col, letter }) {
  addCellToDragPath({ row, col, letter });
}

function handleCellPointerCancel() {
  finishCurrentDragSelection();
}

function handleBoardPointerUp() {
  finishCurrentDragSelection();
}

function addCellToDragPath(cell) {
  if (!state.isDraggingLetters) {
    return;
  }

  const lastCell = state.dragPath[state.dragPath.length - 1];

  if (!lastCell) {
    state.dragPath = [cell];
    updateWordInputFromPath(state.dragPath);
    renderCurrentBoardWithHelp();
    renderMousePanel();
    return;
  }

  if (isSameCell(cell, lastCell)) {
    return;
  }

  const existingIndex = state.dragPath.findIndex((selectedCell) =>
    isSameCell(cell, selectedCell)
  );

  if (existingIndex >= 0) {
    if (existingIndex < state.dragPath.length - 1) {
      state.dragMoved = true;
      state.dragPath = state.dragPath.slice(0, existingIndex + 1);

      updateWordInputFromPath(state.dragPath);
      renderCurrentBoardWithHelp();
      renderMousePanel();
    }

    return;
  }

  if (!areAdjacentCells(cell, lastCell)) {
    return;
  }

  state.dragMoved = true;
  state.dragPath = [...state.dragPath, cell];

  updateWordInputFromPath(state.dragPath);
  renderCurrentBoardWithHelp();
  renderMousePanel();
}

function handleCellPointerUp({ row, col, letter }) {
  if (!state.isDraggingLetters) {
    return;
  }

  const wasDragSelection = state.dragMoved;

  if (wasDragSelection) {
    finishCurrentDragSelection();
    return;
  }

  state.isDraggingLetters = false;
  state.suppressNextCellClick = true;
  state.dragPath = [];
  state.dragMoved = false;

  if (state.helpLevel >= 2) {
    updateHelpCell({ row, col, letter });
    updateWordInputFromPath(state.selectedPath);
    renderCurrentBoardWithHelp();
    renderMousePanel();
    return;
  }

  addClickedLetterToSelection({ row, col, letter });
}

function addClickedLetterToSelection(cell) {
  const lastCell = state.selectedPath[state.selectedPath.length - 1];

  if (!lastCell) {
    state.selectedPath = [cell];
    updateSelectedWordFromPath();
    return;
  }

  if (isSameCell(cell, lastCell)) {
    state.selectedPath = state.selectedPath.slice(0, -1);
    updateSelectedWordFromPath();
    return;
  }

  const existingIndex = state.selectedPath.findIndex((selectedCell) =>
    isSameCell(cell, selectedCell)
  );

  if (existingIndex >= 0) {
    state.selectedPath = state.selectedPath.slice(0, existingIndex + 1);
    updateSelectedWordFromPath();
    return;
  }

  if (!areAdjacentCells(cell, lastCell)) {
    state.selectedPath = [cell];
    updateSelectedWordFromPath();
    return;
  }

  state.selectedPath = [...state.selectedPath, cell];
  updateSelectedWordFromPath();
}

function updateHelpCell({ row, col, letter }) {
  const words = state.solutionCellWords?.[row]?.[col] || [];

  state.selectedHelpCell = {
    row,
    col,
    letter,
    words,
  };

  refreshHelpDisplay();
}

function updateSelectedWordFromPath() {
  state.selectedWord = pathToWord(state.selectedPath);
  state.keyboardPreviewPath = [];
  wordInput.value = state.selectedWord;
  renderCurrentBoardWithHelp();
  renderMousePanel();
}

function updateWordInputFromPath(path) {
  const word = pathToWord(path);
  state.keyboardPreviewPath = [];
  wordInput.value = word;
}

function clearSelectedLetters() {
  state.selectedPath = [];
  state.selectedWord = "";
  state.keyboardPreviewPath = [];
  state.hoveredFoundWordPath = [];
  state.dragPath = [];
  state.dragMoved = false;
  state.isDraggingLetters = false;
  state.suppressNextCellClick = false;

  wordInput.value = "";
  renderCurrentBoardWithHelp();
  renderMousePanel();
}

function pathToWord(path) {
  return path.map((cell) => cell.letter).join("");
}

function areAdjacentCells(a, b) {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}

function isSameCell(a, b) {
  return a.row === b.row && a.col === b.col;
}

function changeHelpLevel() {
  const maxHelpLevel = getMaxHelpLevel();

  state.helpLevel = getNextSimplifiedHelpLevel(state.helpLevel, maxHelpLevel);
  state.selectedHelpCell = null;

  refreshHelpDisplay();
  refreshRightRulesPanel();
  renderCurrentBoardWithHelp();
}

function getMaxHelpLevel() {
  const configuredLevel = Math.min(3, Math.max(0, state.gameOptions?.maxHelpLevel ?? 3));

  // Le niveau intermédiaire "aide par lettre" est supprimé.
  // Si la partie autorise au moins deux niveaux d'aide, le second niveau visible ouvre directement la solution complète.
  if (configuredLevel <= 1) {
    return configuredLevel;
  }

  return 3;
}

function getNextSimplifiedHelpLevel(currentLevel, maxHelpLevel) {
  if (maxHelpLevel <= 0) {
    return 0;
  }

  if (maxHelpLevel <= 1) {
    return currentLevel >= 1 ? 0 : 1;
  }

  if (currentLevel <= 0) {
    return 1;
  }

  if (currentLevel === 1) {
    return 3;
  }

  return 0;
}

function normalizeSimplifiedHelpLevel(level, maxHelpLevel) {
  if (maxHelpLevel <= 0) {
    return 0;
  }

  if (maxHelpLevel <= 1) {
    return level >= 1 ? 1 : 0;
  }

  if (level === 2) {
    return 3;
  }

  if (level >= 3) {
    return 3;
  }

  return level >= 1 ? 1 : 0;
}

function clampCurrentHelpLevel() {
  const maxHelpLevel = getMaxHelpLevel();
  const normalizedHelpLevel = normalizeSimplifiedHelpLevel(state.helpLevel, maxHelpLevel);

  if (state.helpLevel !== normalizedHelpLevel) {
    state.helpLevel = normalizedHelpLevel;
    state.selectedHelpCell = null;
  }
}

function handleGameStarted(data) {
  state.gameStatus = "playing";
  state.gameMode = data.mode ?? "timed";
  state.gameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...(data.gameOptions ?? {
      durationMode: data.durationSeconds > 0 ? "timer" : "noTimer",
      durationSeconds: data.durationSeconds,
    }),
  };
  state.board = data.board;
  saveLastBoardSuggestion(data.board);
  state.startedAt = data.startedAt;
  state.endedAt = null;
  state.durationSeconds = data.durationSeconds;
  state.foundWords = [];
  state.selectedFoundWordsPlayerId = state.playerId || "";
  state.score = 0;
  state.invalidCount = 0;
  state.solutionCellWords = [];
  state.solutionsStats = null;
  state.selectedHelpCell = null;
  state.endScreenVisible = false;
  state.selectedPath = [];
  state.selectedWord = "";
  state.keyboardPreviewPath = [];
  state.hoveredFoundWordPath = [];
  state.dragPath = [];
  state.dragMoved = false;
  state.isDraggingLetters = false;
  state.suppressNextCellClick = false;
  pendingSubmissionPath = [];
  state.helpLevel = 0;
  clampCurrentHelpLevel();

  hideEndScreen();
  hideEndScreenOverlay();
  stopCountdownWarning();
  renderFoundWords(foundWordsElement, state.foundWords);
  setWordFeedback(wordFeedbackElement, "");

  wordInput.disabled = false;
  wordSubmitButton.disabled = false;
  updateHostControls();

  refreshHelpDisplay();
  renderCurrentBoardWithHelp();
  renderMousePanel();
  updateGameStatus("playing");

  renderModePanel();
  renderPlayerPreferences();
  renderRulesSummary();
  refreshRightRulesPanel();

  if (
    state.gameMode === "timed" &&
    state.gameOptions.durationMode === "timer"
  ) {
    startButton.disabled = true;

    startCountdownWarning(data.startedAt, data.durationSeconds);

    startLocalTimer({
      timerElement,
      startedAt: data.startedAt,
      durationSeconds: data.durationSeconds,
      onEnd: () => {
        state.endedAt = Date.now();
        updateGameStatus("ended");
        showEndScreenNow();
      },
    });
  } else {
    stopCountdownWarning();
    stopLocalTimer();
    renderTimer(timerElement, 0);
    timerElement.textContent =
      state.gameMode === "solution"
        ? "Mode solution"
        : state.gameOptions.durationMode === "targetScore"
          ? "Objectif"
          : "Sans timer";
    updateHostControls();
    renderTargetScoreStatus();
  }

  const startDate = new Date(data.startedAt);

  addLog(
    logElement,
    state.gameMode === "solution"
      ? `Mode solution lancé à ${startDate.toLocaleTimeString()}.`
      : state.gameOptions.durationMode === "timer"
        ? `Nouvelle grille chronométrée reçue. Début officiel : ${startDate.toLocaleTimeString()} — durée : ${data.durationSeconds}s`
        : state.gameOptions.durationMode === "targetScore"
          ? `Nouvelle grille avec objectif de score reçue à ${startDate.toLocaleTimeString()}.`
          : `Nouvelle grille sans timer reçue à ${startDate.toLocaleTimeString()}.`
  );
}

function handleGameEnded(data) {
  const shouldOpenEndPopup =
    state.gameStatus === "playing" || state.endScreenVisible === true;
  const shouldLaunchConfetti = state.gameStatus === "playing";

  state.gameStatus = "ended";
  state.gameMode = data.mode ?? "timed";
  state.gameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...(data.gameOptions ?? {
      durationMode: data.durationSeconds > 0 ? "timer" : "noTimer",
      durationSeconds: data.durationSeconds,
    }),
  };
  state.board = data.board;
  state.startedAt = data.startedAt;
  state.endedAt = data.endedAt;
  state.durationSeconds = data.durationSeconds;
  state.endScreenVisible = shouldOpenEndPopup;
  ensureSelectedFoundWordsPlayer();
  clampCurrentHelpLevel();

  clearSelectedLetters();
  renderCurrentBoardWithHelp();
  renderTimer(timerElement, 0);
  stopCountdownWarning();
  stopLocalTimer();

  updateGameStatus("ended");
  updateHostControls();

  const endDate = new Date(data.endedAt);

  wordInput.disabled = true;
  wordSubmitButton.disabled = true;
  updateHostControls();

  if (shouldOpenEndPopup) {
    showEndScreenNow({ withConfetti: shouldLaunchConfetti });
  } else {
    hideEndScreen();
    hideEndScreenOverlay();
  }

  renderModePanel();
  renderPlayerPreferences();
  renderRulesSummary();
  refreshRightRulesPanel();

  addLog(
    logElement,
    `Partie terminée à ${endDate.toLocaleTimeString()} — temps écoulé : ${getElapsedDurationSeconds()}s.`
  );
}

function renderPlayerPreferences() {
  renderPlayerPreferencesPanel(endGameButton, state.playerPreferences, (preferences) => {
    state.playerPreferences = {
      ...state.playerPreferences,
      ...preferences,
    };

    saveLocalJson(STORAGE_KEYS.playerPreferences, state.playerPreferences);
    renderPlayerPreferences();
  });
}



function refreshRightRulesPanel() {
  const rulesCard = document.querySelector("#mockup-help-card");
  const uniqueCard = document.querySelector("#mockup-unique-card");
  const penaltyCard = document.querySelector("#mockup-penalty-card");

  if (!rulesCard && !uniqueCard && !penaltyCard) {
    return;
  }

  const options = {
    ...DEFAULT_GAME_OPTIONS,
    ...(state.gameOptions ?? {}),
  };

  if (uniqueCard) {
    uniqueCard.hidden = !options.uniqueWords;
    updateOptionCardText(
      uniqueCard,
      "Un mot trouvé par un autre joueur devient indisponible pour les autres."
    );
  }

  if (penaltyCard) {
    const penalty = Number(options.invalidWordPenalty ?? 1);
    penaltyCard.hidden = !options.penalizeInvalidWords;
    updateOptionCardText(
      penaltyCard,
      `Chaque mot invalide retire <strong>-${penalty} point${penalty > 1 ? "s" : ""}</strong>.`
    );
  }

  if (rulesCard) {
    renderRulesHelpCardV22(rulesCard, options);
  }
}

function updateOptionCardText(card, bodyHtml) {
  const body = card.querySelector("p");

  if (body) {
    body.innerHTML = bodyHtml;
    body.hidden = false;
  }

  for (const status of card.querySelectorAll(".mockup-option-status-v18, .mockup-option-status-v20")) {
    status.remove();
  }
}

function renderRulesHelpCardV22(card, options) {
  const maxHelpLevel = getMaxHelpLevel();
  const visibleHelpLevel = normalizeSimplifiedHelpLevel(state.helpLevel ?? 0, maxHelpLevel);

  if (state.helpLevel !== visibleHelpLevel) {
    state.helpLevel = visibleHelpLevel;
  }

  const body = card.querySelector("p");
  if (body) {
    body.hidden = true;
  }

  for (const list of card.querySelectorAll(".mockup-help-list")) {
    list.remove();
  }

  for (const oldPanel of card.querySelectorAll(".rules-help-panel-v18, .rules-help-panel-v20, .rules-help-panel-v22")) {
    oldPanel.remove();
  }

  const panel = document.createElement("div");
  panel.className = "rules-help-panel-v22";

  const actions = document.createElement("div");
  actions.className = "rules-help-actions-v22";

  const level = document.createElement("span");
  level.className = "rules-help-level-v22";
  level.textContent = getRulesHelpLevelLabelV22(visibleHelpLevel, maxHelpLevel);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "rules-help-button-v22";
  button.disabled = maxHelpLevel <= 0;
  button.textContent = getRulesHelpButtonLabelV22(visibleHelpLevel, maxHelpLevel);
  button.addEventListener("click", handleRulesHelpButtonClickV22);

  actions.append(level, button);

  const content = document.createElement("div");
  content.className = "rules-help-content-v22";

  const title = document.createElement("p");
  title.className = "rules-help-content-title-v22";
  title.textContent = getRulesHelpContentTitleV22(visibleHelpLevel, maxHelpLevel);

  const details = document.createElement("ul");
  details.className = "rules-help-details-v22";

  for (const [bullet, text] of getRulesHelpDetailsV22(visibleHelpLevel, maxHelpLevel)) {
    const item = document.createElement("li");

    const bulletElement = document.createElement("span");
    bulletElement.className = "rules-help-bullet-v22";
    bulletElement.textContent = bullet;

    const label = document.createElement("span");
    label.textContent = text;

    item.append(bulletElement, label);
    details.append(item);
  }

  content.append(title, details);

  if (visibleHelpLevel >= 3 && maxHelpLevel >= 3) {
    content.append(createSolutionListV22());
  }

  panel.append(actions, content);

  const heading = card.querySelector("h2");
  if (heading?.nextSibling) {
    card.insertBefore(panel, heading.nextSibling);
  } else {
    card.append(panel);
  }
}

function handleRulesHelpButtonClickV22(event) {
  event.preventDefault();
  event.stopPropagation();

  const maxHelpLevel = getMaxHelpLevel();

  if (maxHelpLevel <= 0) {
    return;
  }

  if (state.gameStatus === "playing" && state.board) {
    changeHelpLevel();
    return;
  }

  state.helpLevel = getNextSimplifiedHelpLevel(state.helpLevel, maxHelpLevel);
  state.selectedHelpCell = null;
  refreshRightRulesPanel();
}

function getRulesHelpButtonLabelV22(level, maxLevel) {
  if (maxLevel <= 0) {
    return "Aide désactivée";
  }

  if (level >= 3 || (maxLevel <= 1 && level >= 1)) {
    return "Règles";
  }

  return level === 0 ? "Aide" : "Solution";
}

function getRulesHelpLevelLabelV22(level, maxLevel) {
  if (maxLevel <= 0) {
    return "Niveau d’aide 0 — aide désactivée";
  }

  if (level >= 3) {
    return "Aide 2 — solution";
  }

  return level === 0 ? "Aide 0 — règles" : `Aide ${level}`;
}

function getRulesHelpContentTitleV22(level, maxLevel) {
  if (level <= 0 || maxLevel <= 0) {
    return "Rappel des règles";
  }

  if (level >= 3) {
    return "Solution complète";
  }

  return "Aide niveau 1";
}

function getRulesHelpDetailsV22(level, maxLevel) {
  if (level <= 0 || maxLevel <= 0) {
    return [
      ["3+", "Mots de 3 lettres minimum."],
      ["↔", "Toutes les lettres doivent être connectées, diagonales incluses."],
      ["★", "Points : 3-4 = 1 · 5 = 2 · 6 = 3 · 7 = 5 · 8+ = 11."],
    ];
  }

  if (level === 1) {
    return [
      [
        "1",
        "Cases : nombre de mots dispo.",
      ],
      [
        "★",
        state.solutionsStats
          ? `${state.foundWords.length}/${state.solutionsStats.totalWords ?? "?"} mots trouvés · ${state.score}/${state.solutionsStats.maxScore ?? "?"} points.`
          : "Les compteurs se complètent dès le calcul des solutions.",
      ],
    ];
  }

  const remainingWords = getRemainingSolutionWordsV22();

  return [
    [
      "2",
      remainingWords.length
        ? `${remainingWords.length} solution${remainingWords.length > 1 ? "s" : ""} restante${remainingWords.length > 1 ? "s" : ""}.`
        : "Aucune solution restante.",
    ],
  ];
}

function createSolutionListV22() {
  const list = document.createElement("div");
  list.className = "rules-solution-list-v22";

  const remainingWords = getRemainingSolutionWordsV22();

  if (!remainingWords.length) {
    const empty = document.createElement("span");
    empty.className = "rules-solution-chip-v22";
    empty.textContent = "Tout trouvé";
    list.append(empty);
    return list;
  }

  for (const word of remainingWords) {
    const chip = document.createElement("span");
    chip.className = "rules-solution-chip-v22";
    chip.textContent = word;
    list.append(chip);
  }

  return list;
}

function getRemainingSolutionWordsV22() {
  const allWords = new Set();

  for (const row of state.solutionCellWords ?? []) {
    for (const cellWords of row ?? []) {
      for (const word of cellWords ?? []) {
        allWords.add(word);
      }
    }
  }

  const foundWords = new Set(getFoundWordList());

  return [...allWords]
    .filter((word) => !foundWords.has(word))
    .sort((a, b) => {
      const lengthDiff = a.length - b.length;

      if (lengthDiff !== 0) {
        return lengthDiff;
      }

      return a.localeCompare(b, "fr");
    });
}


function syncRulesSummarySlotVisibility() {
  // Conservé comme point de synchronisation : la visibilité réelle est portée par #rules-summary.
}

function renderRulesSummary() {
  if (state.gameStatus !== "playing") {
    rulesSummaryElement.hidden = true;
    rulesSummaryElement.innerHTML = "";
    syncRulesSummarySlotVisibility();
    return;
  }

  const badges = [];

  if (state.gameOptions.uniqueWords) {
    badges.push('<span class="rule-pill rule-pill-danger">Mot unique dans la salle</span>');
  }

  if (state.gameOptions.penalizeInvalidWords) {
    const penalty = Number(state.gameOptions.invalidWordPenalty ?? 1);
    badges.push(`<span class="rule-pill rule-pill-warning">Pénalité -${penalty} point${penalty > 1 ? "s" : ""}</span>`);
  }

  if (!badges.length) {
    rulesSummaryElement.hidden = true;
    rulesSummaryElement.innerHTML = "";
    syncRulesSummarySlotVisibility();
    return;
  }

  rulesSummaryElement.hidden = false;
  rulesSummaryElement.innerHTML = badges.join("");
  syncRulesSummarySlotVisibility();
}



function renderModePanel() {
  renderModeControls(startButton, {
    visible: state.gameStatus !== "playing",
    disabled: !state.socket || !isCurrentPlayerHost(),
    gameOptions: state.gameOptions,
    onOptionsChange: syncPendingGameOptions,
    onStartSolution: startSolutionMode,
  });
}

function refreshHelpDisplay() {
  const maxHelpLevel = getMaxHelpLevel();
  const helpPanel = document.querySelector("#help-panel");

  if (state.gameStatus !== "playing" || !state.board || maxHelpLevel <= 0) {
    state.helpLevel = 0;
    state.selectedHelpCell = null;

    if (helpPanel) {
      helpPanel.hidden = true;
    }

    refreshRightRulesPanel();
    return;
  }

  if (helpPanel) {
    helpPanel.hidden = false;
  }

  renderHelpPanel(wordForm, {
    helpLevel: Math.min(state.helpLevel, maxHelpLevel),
    maxHelpLevel,
    stats: state.solutionsStats,
    progress: {
      foundWords: state.foundWords.length,
      foundScore: state.score,
    },
    selectedCell: state.selectedHelpCell,
    foundWords: getFoundWordList(),
    onHelpLevelChange: changeHelpLevel,
  });

  refreshRightRulesPanel();
}


function scheduleBoardFitV31() {
  window.requestAnimationFrame(() => {
    updateBoardFitV31();
  });
}

function updateBoardFitV31() {
  if (!boardElement || !wordForm) {
    return;
  }

  const center = document.querySelector("#boggle-center");
  const statusPanel = document.querySelector("#play-status-panel");

  if (!center) {
    return;
  }

  const centerRect = center.getBoundingClientRect();
  const centerStyle = window.getComputedStyle(center);
  const paddingTop = parseFloat(centerStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(centerStyle.paddingBottom) || 0;
  const paddingLeft = parseFloat(centerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(centerStyle.paddingRight) || 0;
  const rowGap = parseFloat(centerStyle.rowGap || centerStyle.gap) || 12;

  const statusHeight = statusPanel?.getBoundingClientRect().height ?? 0;
  const formHeight = wordForm.getBoundingClientRect().height || 0;
  const feedbackVisible = wordFeedbackElement && wordFeedbackElement.textContent.trim().length > 0;
  const feedbackHeight = feedbackVisible
    ? wordFeedbackElement.getBoundingClientRect().height || 0
    : 0;

  const viewportBottom = window.innerHeight - 14;
  const availableVerticalSpace = Math.max(
    260,
    viewportBottom -
      centerRect.top -
      paddingTop -
      paddingBottom -
      statusHeight -
      formHeight -
      feedbackHeight -
      rowGap * 3 -
      16
  );

  const availableHorizontalSpace = Math.max(
    260,
    centerRect.width - paddingLeft - paddingRight - 8
  );

  const boardSize = Math.floor(
    Math.max(
      260,
      Math.min(availableHorizontalSpace, availableVerticalSpace, 690)
    )
  );

  boardElement.style.setProperty("--board-fit-size-v31", `${boardSize}px`);
}


function renderCurrentBoardWithHelp() {
  const activePath = state.hoveredFoundWordPath?.length
    ? state.hoveredFoundWordPath
    : state.isDraggingLetters
      ? state.dragPath
      : state.selectedPath.length > 0
        ? state.selectedPath
        : state.keyboardPreviewPath ?? [];

  renderBoard(boardElement, state.board, {
    onCellClick: handleBoardCellClick,
    onCellHelpClick: handleCellHelpClick,
    onCellPointerDown: handleCellPointerDown,
    onCellPointerEnter: handleCellPointerEnter,
    onCellPointerMove: handleCellPointerMove,
    onCellPointerUp: handleCellPointerUp,
    onCellPointerCancel: handleCellPointerCancel,
    onBoardPointerUp: handleBoardPointerUp,
    cellCounts: state.solutionsStats?.cellCounts || [],
    foundCellCounts: createFoundCellCounts(),
    selectedCells: activePath.map((cell) => `${cell.row}:${cell.col}`),
    showCounts: state.helpLevel >= 1,
    canShowCellHelp: false,
    canClickCells: state.gameStatus === "playing",
  });

  scheduleBoardFitV31();
}

function renderMousePanel() {
  renderMouseInputPanel(wordForm, {
    word: state.isDraggingLetters ? pathToWord(state.dragPath) : state.selectedWord,
    onSubmit: submitSelectedWord,
    onClear: clearSelectedLetters,
  });
}

function showEndScreenNow({ withConfetti = true } = {}) {
  state.endScreenVisible = true;

  renderCurrentEndScreen();
  showEndScreenOverlay();

  if (withConfetti && isCurrentPlayerWinning()) {
    playVictorySound();
    launchConfetti();
  }
}

function showEndScreenOverlay() {
  document.body.classList.add("boggle-end-screen-open");
  ensureEndScreenBackdrop();
  renderVictoryModalV16();
}

function ensureEndScreenBackdrop() {
  let backdrop = document.querySelector("#end-screen-backdrop");

  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "end-screen-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.append(backdrop);
  }

  backdrop.onclick = closeEndScreenPopup;
}

function renderVictoryModalV16() {
  document.querySelector("#victory-modal-v16")?.remove();

  const source = document.querySelector("#end-screen");
  const modal = document.createElement("section");

  modal.id = "victory-modal-v16";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Écran de fin de partie");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "victory-modal-close-v16";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Fermer l’écran de fin de partie");
  closeButton.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeEndScreenPopup();
  };

  modal.append(closeButton);

  if (source) {
    const clonedSource = source.cloneNode(true);

    clonedSource.removeAttribute("id");
    clonedSource.hidden = false;
    clonedSource.removeAttribute("hidden");
    clonedSource.removeAttribute("style");

    for (const oldCloseButton of clonedSource.querySelectorAll(".end-screen-close")) {
      oldCloseButton.remove();
    }

    while (clonedSource.firstChild) {
      modal.append(clonedSource.firstChild);
    }

    source.hidden = true;
    source.setAttribute("aria-hidden", "true");
  } else {
    const fallbackTitle = document.createElement("h2");
    fallbackTitle.textContent = "Fin de partie";
    modal.append(fallbackTitle);

    const fallbackText = document.createElement("p");
    fallbackText.textContent = "La partie est terminée.";
    modal.append(fallbackText);
  }

  document.body.append(modal);
  closeButton.focus({ preventScroll: true });
}



function closeEndScreenPopup() {
  state.endScreenVisible = false;
  hideEndScreen();
  hideEndScreenOverlay();
}

function hideEndScreenOverlay() {
  document.body.classList.remove("boggle-end-screen-open");
  document.querySelector("#end-screen-backdrop")?.remove();
  document.querySelector("#victory-modal-v16")?.remove();

  const source = document.querySelector("#end-screen");

  if (source) {
    source.removeAttribute("aria-hidden");
  }

  for (const piece of document.querySelectorAll(".boggle-confetti-piece")) {
    piece.remove();
  }
}

function isCurrentPlayerWinning() {
  if (!state.playerId || !Array.isArray(state.players) || !state.players.length) {
    return false;
  }

  const scores = state.players.map((player) => Number(player.score ?? 0));
  const bestScore = Math.max(...scores);
  const currentPlayer = state.players.find((player) => player.id === state.playerId);

  return Boolean(currentPlayer) && Number(currentPlayer.score ?? 0) === bestScore && bestScore > 0;
}

function playVictorySound() {
  if (state.playerPreferences?.soundEnabled === false) {
    return;
  }

  const volume = Math.min(1, Math.max(0, Number(state.playerPreferences?.masterVolume ?? 0.65)));

  if (volume <= 0) {
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    countdownAudioContext ||= new AudioContextClass();

    if (countdownAudioContext.state === "suspended") {
      countdownAudioContext.resume().catch(() => {});
    }

    const now = countdownAudioContext.currentTime + 0.01;

    // Mini fanfare : Sol — Sol — Do aigu — Mi aigu — Sol aigu
    playVictoryTone(countdownAudioContext, now, 392.0, 0.11, volume * 0.14);
    playVictoryTone(countdownAudioContext, now + 0.13, 392.0, 0.11, volume * 0.14);
    playVictoryTone(countdownAudioContext, now + 0.28, 523.25, 0.16, volume * 0.18);
    playVictoryTone(countdownAudioContext, now + 0.48, 659.25, 0.18, volume * 0.18);
    playVictoryTone(countdownAudioContext, now + 0.71, 783.99, 0.34, volume * 0.16);
    playVictoryTone(countdownAudioContext, now + 0.74, 1174.66, 0.20, volume * 0.07);
  } catch {
    // Son de confort uniquement.
  }
}

function playVictoryTone(ctx, startAt, frequency, duration, gainValue) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.04);
}

function launchConfetti() {
  if (state.playerPreferences?.visualEffectsEnabled === false) {
    return;
  }

  const colors = ["#f8e6af", "#b42318", "#7a4a1f", "#4b3322", "#f6d58c"];
  const count = 216;

  for (let index = 0; index < count; index++) {
    const piece = document.createElement("span");
    piece.className = "boggle-confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 1.4}s`;
    piece.style.setProperty("--confetti-drift", `${(Math.random() - 0.5) * 18}rem`);

    document.body.append(piece);

    window.setTimeout(() => piece.remove(), 5600);
  }
}

function renderCurrentEndScreen() {
  renderEndScreen(boardElement, {
    players: state.players,
    currentPlayerId: state.playerId,
    maxScore: state.solutionsStats?.maxScore ?? 0,
    totalWords: state.solutionsStats?.totalWords ?? 0,
    durationSeconds: getElapsedDurationSeconds(),
  });

  if (document.body.classList.contains("boggle-end-screen-open")) {
    renderVictoryModalV16();
  }
}

function startCountdownWarning(startedAt, durationSeconds) {
  stopCountdownWarning();

  if (!durationSeconds || durationSeconds <= 0) {
    return;
  }

  countdownWarningInterval = window.setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    timerElement.classList.toggle(
      "boggle-timer-ending",
      remainingSeconds > 0 && remainingSeconds <= 10
    );

    if (
      remainingSeconds > 0 &&
      remainingSeconds <= 10 &&
      remainingSeconds !== lastCountdownTickSecond
    ) {
      lastCountdownTickSecond = remainingSeconds;
      playCountdownTick(remainingSeconds);
    }

    if (remainingSeconds <= 0) {
      stopCountdownWarning();
    }
  }, 200);
}

function stopCountdownWarning() {
  if (countdownWarningInterval) {
    window.clearInterval(countdownWarningInterval);
    countdownWarningInterval = null;
  }

  lastCountdownTickSecond = null;
  timerElement.classList.remove("boggle-timer-ending");
}

function playCountdownTick(remainingSeconds) {
  if (state.playerPreferences?.soundEnabled === false) {
    return;
  }

  const volume = Math.min(1, Math.max(0, Number(state.playerPreferences?.masterVolume ?? 0.65)));

  if (volume <= 0) {
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    countdownAudioContext ||= new AudioContextClass();

    if (countdownAudioContext.state === "suspended") {
      countdownAudioContext.resume().catch(() => {});
    }

    const now = countdownAudioContext.currentTime + 0.01;
    const frequency = remainingSeconds <= 3 ? 880 : 660;

    playCountdownTone(countdownAudioContext, now, frequency, 0.055, volume * 0.16);
  } catch {
    // Son de confort uniquement.
  }
}

function playCountdownTone(ctx, startAt, frequency, duration, gainValue) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function getElapsedDurationSeconds() {
  if (!state.startedAt) {
    return state.durationSeconds;
  }

  const endTime = state.endedAt ?? Date.now();

  return Math.max(0, Math.round((endTime - state.startedAt) / 1000));
}

function createFoundCellCounts() {
  if (!state.board || !state.solutionCellWords?.length) {
    return [];
  }

  const foundSet = new Set(getFoundWordList());

  return state.solutionCellWords.map((row) =>
    row.map((words) => words.filter((word) => foundSet.has(word)).length)
  );
}

function getFoundWordList() {
  return state.foundWords.map((item) => item.word);
}

function updateGameStatus(status) {
  state.gameStatus = status;

  if (status === "waiting") {
    stopCountdownWarning();
    stopLocalTimer();
    hideEndScreenOverlay();

    state.board = null;
    state.startedAt = null;
    state.endedAt = null;
    state.durationSeconds = DEFAULT_DURATION_SECONDS;
    state.gameOptions = { ...DEFAULT_GAME_OPTIONS };

    state.foundWords = [];
    state.selectedFoundWordsPlayerId = state.playerId || "";
    state.score = 0;
    state.solutionCellWords = [];
    state.solutionsStats = null;
    state.selectedHelpCell = null;
    state.endScreenVisible = false;
    state.selectedPath = [];
    state.selectedWord = "";
    state.keyboardPreviewPath = [];
    state.dragPath = [];
    state.dragMoved = false;
    state.isDraggingLetters = false;
    pendingSubmissionPath = [];

    renderFoundWords(foundWordsElement, state.foundWords);
    setWordFeedback(wordFeedbackElement, "");
    refreshHelpDisplay();
    renderMousePanel();
    hideEndScreen();

    wordInput.disabled = true;
    wordSubmitButton.disabled = true;
    updateHostControls();

    boardElement.innerHTML = "";
    renderTimer(timerElement, DEFAULT_DURATION_SECONDS);

    gameStatusElement.textContent = "En attente de lancement";
    updateHostControls();
    renderRulesSummary();
    refreshHomeVisibility();

    return;
  }

  if (status === "playing") {
    gameStatusElement.textContent = "Partie en cours";

    updateHostControls();
    renderRulesSummary();
    refreshHomeVisibility();
    return;
  }

  if (status === "ended") {
    stopCountdownWarning();
    stopLocalTimer();

    gameStatusElement.textContent = "Partie terminée";
    updateHostControls();
    renderRulesSummary();
    wordInput.disabled = true;
    wordSubmitButton.disabled = true;
    updateHostControls();
    refreshHomeVisibility();

    return;
  }
}

function resetGameUiToWaiting() {
  state.gameStatus = "waiting";
  state.gameMode = "timed";
  state.gameOptions = { ...DEFAULT_GAME_OPTIONS };
  state.board = null;
  state.startedAt = null;
  state.endedAt = null;
  state.durationSeconds = DEFAULT_DURATION_SECONDS;

  stopCountdownWarning();
  hideEndScreenOverlay();

  boardElement.innerHTML = "";
  gameStatusElement.textContent = "En attente de lancement";
  renderTimer(timerElement, DEFAULT_DURATION_SECONDS);

  startButton.disabled = !state.socket;
  renderModePanel();
  state.foundWords = [];
  state.selectedFoundWordsPlayerId = state.playerId || "";
  state.score = 0;
  state.invalidCount = 0;
  state.solutionCellWords = [];
  state.solutionsStats = null;
  state.selectedHelpCell = null;
  state.endScreenVisible = false;
  state.selectedPath = [];
  state.selectedWord = "";
  state.keyboardPreviewPath = [];
  state.hoveredFoundWordPath = [];
  state.dragPath = [];
  state.dragMoved = false;
  state.isDraggingLetters = false;
  state.suppressNextCellClick = false;

  renderFoundWords(foundWordsElement, state.foundWords);
  setWordFeedback(wordFeedbackElement, "");
  refreshHelpDisplay();
  renderMousePanel();
  hideEndScreen();

  wordInput.disabled = true;
  wordSubmitButton.disabled = true;
  updateHostControls();
  refreshRightRulesPanel();
  refreshHomeVisibility();
}
