import { state } from "./core/state.js";
import { createRoomSocket, sendMessage } from "./net/socket.js";
import { renderBoard } from "./ui/board-ui.js";
import { renderPlayers } from "./ui/players-ui.js";
import { addLog } from "./ui/log-ui.js";
import { setWordFeedback } from "./ui/words-ui.js";
import {
  renderTimer,
  startLocalTimer,
  stopLocalTimer,
} from "./ui/timer-ui.js";
import {
  getNextHelpLevel,
  renderHelpPanel,
} from "./ui/help-ui.js";
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

const STORAGE_KEYS = {
  playerName: "boggle:playerName",
  lastRoomId: "boggle:lastRoomId",
  playerPreferences: "boggle:playerPreferences",
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

injectDesignPassStyles();


function injectDesignPassStyles() {
  if (document.querySelector("#boggle-design-pass-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-design-pass-style";
  style.textContent = `
    :root {
      --boggle-ink: #4b3322;
      --boggle-line: rgba(90, 59, 35, 0.22);
      --boggle-paper-soft: rgba(255, 248, 234, 0.76);
      --boggle-paper-strong: rgba(255, 248, 234, 0.96);
      --boggle-pill: rgba(90, 59, 35, 0.08);
      --boggle-danger: #b42318;
      --boggle-danger-line: #7f1d1d;
      --boggle-radius-button: 0.65rem;
      --boggle-radius-badge: 999px;
    }

    button:not(.board-cell),
    .ui-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.15rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--boggle-radius-button);
      font-weight: 850;
      line-height: 1.15;
      cursor: pointer;
      box-sizing: border-box;
    }

    button:not(.board-cell):disabled,
    .ui-button:disabled {
      opacity: 0.52;
      cursor: not-allowed;
    }

    .info-badge,
    #game-status,
    #timer,
    #status,
    .rule-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 1.85rem;
      padding: 0 0.58rem;
      border: 1px solid rgba(90, 59, 35, 0.16);
      border-radius: var(--boggle-radius-badge);
      background: var(--boggle-pill);
      color: var(--boggle-ink);
      font-weight: 850;
      line-height: 1.1;
      white-space: nowrap;
      box-sizing: border-box;
    }

    .info-badge-strong,
    #status.connected-badge {
      border-color: rgba(90, 59, 35, 0.28);
      background: rgba(255, 248, 234, 0.9);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
    }

    .compact-badge {
      min-height: 1.15rem;
      padding: 0.08rem 0.24rem;
      font-size: 0.62rem;
      font-weight: 800;
    }

    .danger-button,
    #end-game {
      border: 2px solid var(--boggle-danger-line) !important;
      background: var(--boggle-danger) !important;
      color: #fff !important;
      font-weight: 900 !important;
    }

    #boggle-top {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    #connection-controls {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
      width: 100%;
    }

    #connection-controls #player-preferences {
      margin-left: auto !important;
    }

    .connection-control {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 2.3rem;
    }

    #connection-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
      min-height: 2.3rem;
    }

    #boggle-top input,
    #boggle-top button,
    #connection-status-line,
    #player-preferences {
      align-self: center;
    }

    #boggle-top input,
    #boggle-top button {
      line-height: 1.2;
    }

    #mouse-input-panel {
      display: none !important;
    }

    #game-status {
      width: fit-content;
    }

    #timer {
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    #play-status-panel {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    #play-status-panel #game-status,
    #play-status-panel #timer,
    #play-status-panel #end-game {
      align-self: center;
      margin-top: 0;
      margin-bottom: 0;
    }

    #play-status-panel > h2 {
      flex-basis: 100%;
      width: 100%;
    }

    #connection-status-line {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-left: 0;
      padding: 0.28rem 0.45rem;
      border-radius: 999px;
      background: rgba(255, 248, 234, 0.7);
      line-height: 1.1;
      min-height: 2.15rem;
    }

    #connection-status-line[hidden] {
      display: none !important;
    }

    #connection-status-line:not([hidden]) {
      display: inline-flex !important;
    }

    #status {
      flex-shrink: 0;
    }

    #status[hidden] {
      display: none !important;
    }

    .connection-field-label {
      display: inline-flex;
      align-items: center;
      align-self: center;
      margin: 0;
      font-weight: 850;
      color: #4b3322;
      line-height: 1.2;
      white-space: nowrap;
    }

    #boggle-top input,
    #boggle-top button {
      align-self: center;
      min-height: 2.15rem;
    }

    #copy-room-link {
      display: none !important;
    }

    #boggle-left {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 10rem);
    }

    #found-words-panel {
      display: flex;
      flex: 1 1 auto;
      min-height: 14rem;
      overflow: hidden;
      flex-direction: column;
    }

    #found-words {
      flex: 1 1 auto;
      min-height: 0 !important;
      max-height: none !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      overscroll-behavior: contain;
      padding-right: 0.35rem;
      box-sizing: border-box;
      scrollbar-width: thin;
      align-content: flex-start;
    }

    #players-panel {
      overflow: hidden;
    }

    #players {
      --player-row-height: 2rem;
      --player-row-gap: 0.1rem;
      height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3));
      max-height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3));
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      overscroll-behavior: contain;
      padding-right: 0.25rem;
      box-sizing: content-box;
    }

    .players-scroll-list {
      display: grid;
      grid-auto-rows: var(--player-row-height);
      gap: var(--player-row-gap);
      margin: 0;
      padding: 0;
      list-style: none;
      min-height: 100%;
    }

    .player-row {
      height: var(--player-row-height);
      min-height: 0;
      box-sizing: border-box;
      padding: 0.12rem 0.24rem;
      border: 0;
      border-radius: 0.35rem;
      background: transparent;
      overflow: hidden;
    }

    .player-row-current {
      position: sticky;
      bottom: 0;
      z-index: 3;
      background: rgba(255, 248, 234, 0.96);
      box-shadow:
        inset 3px 0 0 rgba(90, 59, 35, 0.34),
        0 -0.25rem 0.45rem rgba(63, 43, 27, 0.08);
    }

    .player-rank {
      min-width: 1.75rem;
      font-variant-numeric: tabular-nums;
      opacity: 0.72;
    }

    .player-name-line {
      min-width: 0;
      overflow: hidden;
    }

    .player-badges {
      display: inline-flex;
      gap: 0.12rem;
      flex-wrap: nowrap;
      flex-shrink: 0;
    }

    .player-score-line {
      white-space: nowrap;
      font-size: 0.78rem;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    #found-words ol,
    #found-words ul {
      margin-top: 0.35rem;
    }

    #found-words li {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    #board .board-cell.board-cell-hovered::after,
    #board .board-cell:hover::after {
      content: "";
      position: absolute;
      inset: 0.16rem;
      z-index: 2;
      border: 2px solid rgba(154, 100, 34, 0.34);
      border-radius: inherit;
      pointer-events: none;
      background: transparent;
    }

    #mouse-input-panel {
      display: none !important;
    }

    #player-preferences {
      position: relative;
      z-index: 1000;
      margin: 0 0 0 auto !important;
      pointer-events: none;
    }

    #player-preferences > button {
      pointer-events: auto;
      padding: 0.5rem 0.75rem;
      border-radius: var(--boggle-radius-button);
    }

    #player-preferences-body {
      position: absolute;
      right: 0;
      top: calc(100% + 0.45rem);
      width: min(18rem, calc(100vw - 1.5rem));
      pointer-events: auto;
      padding: 0.8rem;
      border: 1px solid rgba(90, 59, 35, 0.22);
      border-radius: 1rem;
      background: rgba(255, 248, 234, 0.96);
      box-shadow: 0 1rem 2rem rgba(63, 43, 27, 0.18);
      backdrop-filter: blur(6px);
    }

    #help-slot {
      width: 100%;
      max-height: calc(100vh - 12rem);
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      box-sizing: border-box;
    }

    #rules-summary {
      width: 100%;
      box-sizing: border-box;
      margin: 0 0 0.65rem;
      padding: 0 0 0.55rem;
      border-bottom: 1px solid rgba(90, 59, 35, 0.12);
    }

    #rules-summary[hidden] {
      display: none !important;
    }

    #help-panel {
      max-height: none;
      overflow: visible;
    }

    #welcome-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
      box-sizing: border-box;
      padding: 1.2rem 0;
    }

    #welcome-panel[hidden] {
      display: none !important;
    }

    .welcome-board {
      width: min(100%, 24rem);
      margin: 0 auto;
    }

    .welcome-board .board-cell {
      min-height: clamp(2.6rem, 10vw, 4.2rem) !important;
      pointer-events: none;
      border: 1px solid rgba(90, 59, 35, 0.22) !important;
      border-radius: 0.75rem !important;
      background: rgba(255, 248, 234, 0.94) !important;
      color: #4b3322 !important;
      box-shadow: 0 0.25rem 0.65rem rgba(63, 43, 27, 0.08) !important;
      font-weight: 950 !important;
    }

    .welcome-board .board-letter {
      font-size: clamp(1.1rem, 3vw, 1.8rem);
      font-weight: 950;
      line-height: 1;
    }

    .welcome-board .board-cell[data-letter=""] {
      opacity: 0.38;
      background: rgba(255, 248, 234, 0.42) !important;
      box-shadow: inset 0 0 0 1px rgba(90, 59, 35, 0.05) !important;
    }

    .welcome-caption {
      max-width: 28rem;
      margin: 0;
      text-align: center;
      color: #4b3322;
      font-weight: 850;
      opacity: 0.86;
    }

    .rule-pill {
      gap: 0.35rem;
      margin: 0.15rem 0.35rem 0.15rem 0;
      font-weight: 900;
    }

    .rule-pill-danger {
      border: 2px solid rgba(169, 67, 63, 0.46);
      background: rgba(169, 67, 63, 0.12);
      color: #7f2e2b;
    }

    .rule-pill-warning {
      border: 2px solid rgba(154, 100, 34, 0.38);
      background: rgba(246, 213, 140, 0.5);
      color: #6a4317;
    }

    .board-cell-selected {
      background: #f8e6af !important;
      color: #2f2218 !important;
      border-color: rgba(122, 74, 31, 0.48) !important;
      box-shadow: 0 0 0 3px rgba(122, 74, 31, 0.10) !important;
    }
  `;

  document.head.appendChild(style);
}


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
document.addEventListener("pointerup", handleGlobalPointerUp);
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
renderPlayerPreferences();

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

  pendingSubmissionPath =
    state.selectedPath.length > 0 &&
    state.selectedWord &&
    normalizeComparableWord(state.selectedWord) === normalizeComparableWord(word)
      ? [...state.selectedPath]
      : [];

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

function normalizeComparableWord(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
    statusElement.hidden = false;
    statusElement.textContent = "Connecté";
    refreshHomeVisibility();
    updateHostControls();
    renderRulesSummary();
    addLog(logElement, `Room connectée : ${data.roomId}`);
    return;
  }

  if (data.type === "system") {
    addLog(logElement, `[système] ${data.text}`);
    return;
  }

  if (data.type === "players") {
    state.players = data.players;

    renderPlayersWithHostBadges(playersElement, data.players);
    updateHostControls();
    renderRulesSummary();

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


function renderFoundWords(element, words) {
  element.innerHTML = "";
  element.style.minHeight = "0";
  element.style.overflowY = "auto";
  element.style.overflowX = "hidden";
  element.style.overscrollBehavior = "contain";
  element.style.paddingRight = "0.35rem";
  element.style.boxSizing = "border-box";
  element.style.display = "flex";
  element.style.flexWrap = "wrap";
  element.style.alignContent = "flex-start";
  element.style.gap = "0.28rem 0.65rem";
  element.style.flex = "1 1 auto";
  element.style.maxHeight = "none";

  if (!words.length) {
    element.textContent = "Aucun mot trouvé pour le moment.";
    return;
  }

  for (const item of [...words].reverse()) {
    const row = document.createElement("span");
    row.style.display = "inline";
    row.style.padding = "0";
    row.style.margin = "0";
    row.style.border = "0";
    row.style.background = "transparent";
    row.style.boxShadow = "none";
    row.style.fontWeight = "750";
    row.style.whiteSpace = "nowrap";

    const points = Number(item.points ?? 0);
    row.textContent = `${item.word} · ${points} pt${points > 1 ? "s" : ""}`;

    element.append(row);
  }

  element.scrollTop = 0;
}

function handleWordAccepted(data) {
  const feedbackPath = takePendingSubmissionPath();

  state.score = data.score;
  state.foundWords = [
    ...state.foundWords,
    {
      word: data.word,
      points: data.points,
    },
  ];

  renderFoundWords(foundWordsElement, state.foundWords);
  setWordFeedback(
    wordFeedbackElement,
    `${data.word} accepté : +${data.points} point(s)`
  );

  clearSelectedLetters();
  refreshHelpDisplay();
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

  const penaltyText = data.penalty ? ` — -${data.penalty} point(s)` : "";
  const feedbackType = data.reasonCode === "invalid" ? "invalid" : "duplicate";
  const label = data.penalty ? `-${data.penalty}` : "!";

  setWordFeedback(
    wordFeedbackElement,
    `${data.word || "Mot"} refusé : ${data.reason}${penaltyText}`
  );

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

  if (state.helpLevel >= 2) {
    updateHelpCell({ row, col, letter });
    return;
  }

  addClickedLetterToSelection({ row, col, letter });
}

function handleCellHelpClick({ row, col, letter }) {
  if (state.helpLevel < 2) {
    return;
  }

  updateHelpCell({ row, col, letter });
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
  wordInput.value = state.selectedWord;
  renderCurrentBoardWithHelp();
  renderMousePanel();
}

function updateWordInputFromPath(path) {
  const word = pathToWord(path);
  wordInput.value = word;
}

function clearSelectedLetters() {
  state.selectedPath = [];
  state.selectedWord = "";
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

  state.helpLevel =
    state.helpLevel >= maxHelpLevel ? 0 : Math.min(maxHelpLevel, state.helpLevel + 1);

  state.selectedHelpCell = null;

  refreshHelpDisplay();
  renderCurrentBoardWithHelp();
}

function getMaxHelpLevel() {
  return Math.min(3, Math.max(0, state.gameOptions?.maxHelpLevel ?? 3));
}

function clampCurrentHelpLevel() {
  const maxHelpLevel = getMaxHelpLevel();

  if (state.helpLevel > maxHelpLevel) {
    state.helpLevel = maxHelpLevel;
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
  state.startedAt = data.startedAt;
  state.endedAt = null;
  state.durationSeconds = data.durationSeconds;
  state.foundWords = [];
  state.score = 0;
  state.solutionCellWords = [];
  state.solutionsStats = null;
  state.selectedHelpCell = null;
  state.endScreenVisible = false;
  state.selectedPath = [];
  state.selectedWord = "";
  state.dragPath = [];
  state.dragMoved = false;
  state.isDraggingLetters = false;
  state.suppressNextCellClick = false;
  pendingSubmissionPath = [];
  state.helpLevel = getMaxHelpLevel();
  clampCurrentHelpLevel();

  hideEndScreen();
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

  if (
    state.gameMode === "timed" &&
    state.gameOptions.durationMode === "timer"
  ) {
    startButton.disabled = true;

    startLocalTimer({
      timerElement,
      startedAt: data.startedAt,
      durationSeconds: data.durationSeconds,
      onEnd: () => {
        updateGameStatus("ended");
      },
    });
  } else {
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
  state.endScreenVisible = true;
  clampCurrentHelpLevel();

  clearSelectedLetters();
  renderCurrentBoardWithHelp();
  renderTimer(timerElement, 0);
  stopLocalTimer();

  updateGameStatus("ended");
  updateHostControls();

  const endDate = new Date(data.endedAt);

  wordInput.disabled = true;
  wordSubmitButton.disabled = true;
  updateHostControls();

  renderCurrentEndScreen();
  renderModePanel();
  renderPlayerPreferences();
  renderRulesSummary();

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

function formatDurationRule() {
  if (state.gameMode === "solution") {
    return "Mode solution";
  }

  if (state.gameOptions.durationMode === "noTimer") {
    return "Sans timer";
  }

  if (state.gameOptions.durationMode === "targetScore") {
    if (state.gameOptions.targetScoreMode === "fixedScore") {
      return `Objectif : ${state.gameOptions.targetScore} point(s)`;
    }

    return `Objectif : ${state.gameOptions.targetScorePercent}% du score max`;
  }

  return `Durée : ${state.gameOptions.durationSeconds} seconde(s)`;
}

function formatHelpRule() {
  const level = Number(state.gameOptions.maxHelpLevel ?? 3);

  if (level <= 0) {
    return "Pas d’aide";
  }

  if (level === 1) {
    return "Aide max : compteurs";
  }

  if (level === 2) {
    return "Aide max : mots par lettre";
  }

  return "Aide max : solution complète";
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

  if (maxHelpLevel <= 0) {
    state.helpLevel = 0;
    state.selectedHelpCell = null;

    if (helpPanel) {
      helpPanel.hidden = true;
    }

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
}

function renderCurrentBoardWithHelp() {
  const activePath = state.isDraggingLetters ? state.dragPath : state.selectedPath;

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
    canShowCellHelp: state.helpLevel >= 2,
    canClickCells: state.gameStatus === "playing",
  });
}

function renderMousePanel() {
  renderMouseInputPanel(wordForm, {
    word: state.isDraggingLetters ? pathToWord(state.dragPath) : state.selectedWord,
    onSubmit: submitSelectedWord,
    onClear: clearSelectedLetters,
  });
}

function renderCurrentEndScreen() {
  renderEndScreen(boardElement, {
    players: state.players,
    currentPlayerId: state.playerId,
    maxScore: state.solutionsStats?.maxScore ?? 0,
    totalWords: state.solutionsStats?.totalWords ?? 0,
    durationSeconds: getElapsedDurationSeconds(),
  });
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
    stopLocalTimer();

    state.board = null;
    state.startedAt = null;
    state.endedAt = null;
    state.durationSeconds = DEFAULT_DURATION_SECONDS;
    state.gameOptions = { ...DEFAULT_GAME_OPTIONS };

    state.foundWords = [];
    state.score = 0;
    state.solutionCellWords = [];
    state.solutionsStats = null;
    state.selectedHelpCell = null;
    state.endScreenVisible = false;
    state.selectedPath = [];
    state.selectedWord = "";
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

  boardElement.innerHTML = "";
  gameStatusElement.textContent = "En attente de lancement";
  renderTimer(timerElement, DEFAULT_DURATION_SECONDS);

  startButton.disabled = !state.socket;
  renderModePanel();
  state.foundWords = [];
  state.score = 0;
  state.solutionCellWords = [];
  state.solutionsStats = null;
  state.selectedHelpCell = null;
  state.endScreenVisible = false;
  state.selectedPath = [];
  state.selectedWord = "";
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
  refreshHomeVisibility();
}
