import { formatBoardForTextarea } from "./core/board-text.js";
import {
  getNextSimplifiedHelpLevel,
  getRulesHelpButtonLabel,
  getRulesHelpContentTitle,
  getRulesHelpLevelLabel,
  normalizeSimplifiedHelpLevel,
} from "./core/help-levels.js";
import { state } from "./core/state.js";
import {
  getFoundWordScoreClass,
  normalizeComparableWord,
  normalizeFoundWordsForDisplay,
  rankPlayers,
} from "./core/player-word-utils.js";
import {
  STORAGE_KEYS,
  getOrCreateClientId,
  loadLocalSettings,
  saveLocalJson,
  saveLocalString,
} from "./core/storage.js";
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
const startButton = document.querySelector("#start");
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

const endGameButton = document.createElement("button");
endGameButton.id = "end-game";
endGameButton.type = "button";
endGameButton.className = "ui-button danger-button";
endGameButton.textContent = "Terminer la partie";
endGameButton.hidden = true;
endGameButton.classList.add("boggle-end-game-button");
endGameButton.addEventListener("click", () => {
  if (!window.confirm("Terminer la partie ?")) {
    return;
  }

  send({
    type: "endGame",
  });
});

timerElement.insertAdjacentElement("afterend", endGameButton);

const rulesSummaryElement = document.createElement("section");
rulesSummaryElement.id = "rules-summary";
rulesSummaryElement.hidden = true;
rulesSummaryElement.classList.add("boggle-rules-summary");
gameStatusElement.insertAdjacentElement("afterend", rulesSummaryElement);

const welcomePanel = createWelcomePanel();
boardElement.insertAdjacentElement("beforebegin", welcomePanel);

applyThemeStyles();




startButton.addEventListener("click", startRandomTimedGame);
wordForm.addEventListener("submit", submitWord);
wordInput.addEventListener("input", handleKeyboardWordInput);
document.addEventListener("pointerup", handleGlobalPointerUp);
window.addEventListener("resize", scheduleBoardFitV31);
window.addEventListener("orientationchange", scheduleBoardFitV31);

const savedSettings = loadLocalSettings();
state.playerPreferences = {
  ...state.playerPreferences,
  ...savedSettings.playerPreferences,
};

startButton.textContent = "Lancer une grille aléatoire";
updateInviteButton();

renderModePanel();
startPlayerIdentityOptionsObserverV902();

renderMouseInputPanel(wordForm, {
  word: "",
  onSubmit: submitSelectedWord,
  onClear: clearSelectedLetters,
});

setupAppLayout();
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
  caption.textContent = "Préparation de la partie…";

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

function getInitialRoomIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const roomId = url.searchParams.get("room");

    return roomId ? roomId.trim().slice(0, 60) : "";
  } catch {
    return "";
  }
}





function updateRoomUrl(roomId) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    window.history.replaceState(null, "", url);
  } catch {
    // L'URL peut rester inchangée si l'historique du navigateur est indisponible.
  }
}

function updateInviteButton() {
  const isConnected =
    Boolean(state.socket) && state.socket.readyState === WebSocket.OPEN;

  /*
   * F2/F4d :
   * L'état connecté est porté par <body>, sans ancien badge DOM.
   */
  document.body.classList.toggle("boggle-session-connected", isConnected);

  refreshHomeVisibility();
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


function takePendingSubmissionPath() {
  const path = pendingSubmissionPath;
  pendingSubmissionPath = [];
  return path;
}

/* V90.1-CLEAN-SESSION START */

/*
 * V90.1 — session propre.
 *
 * Objectif :
 * - ne plus déclencher les connexions internes via l'ancien bouton de connexion ;
 * - ne plus utiliser les champs Room/Pseudo comme source de vérité des nouveaux parcours ;
 * - garder temporairement l'ancien DOM uniquement pour compatibilité manuelle ;
 * - préparer sa suppression complète en v90.2/v90.3.
 *
 * TODO v90-cleanup :
 * - supprimer ancien champ Room de index.html ;
 * - supprimer moveConnectionControls() de layout-ui.js ;
 * - supprimer les règles CSS ancien champ Room ;
 * - remplacer le mot "connexion" par "rejoindre une partie" côté UI.
 */

const GAME_CONTEXTS_V901 = {
  SOLO: "solo",
  DAILY: "daily",
  PUBLIC: "public",
  PRIVATE: "private",
  MANUAL: "manual",
};

function normalizeSessionRoomIdV901(roomId, fallback = "TEST") {
  return String(roomId || fallback).trim();
}

function normalizeSessionPlayerNameV901(playerName, fallback = "Joueur") {
  return String(playerName || fallback).trim();
}

function getStoredPlayerNameV901() {
  const saved = loadLocalSettings();

  return normalizeSessionPlayerNameV901(
    state.playerName || saved.playerName || "",
    "Joueur"
  );
}

/* V90.2-PLAYER-IDENTITY START */

/*
 * V90.2 — identité joueur locale.
 *
 * Objectif :
 * - pseudo + fruit enregistrés dans le navigateur ;
 * - identité modifiable dans Options ;
 * - identité réutilisée automatiquement pour les salons publics/privés ;
 * - demande uniquement si l'identité manque ;
 * - aucune dépendance à l'IP, aucun compte utilisateur.
 *
 * TODO v90-cleanup :
 * - champ privé #private-v89-name supprimé en E6c ;
 * - envoyer pseudo et fruit séparément au serveur si le protocole WebSocket évolue.
 */

const PLAYER_IDENTITY_STORAGE_KEY_V902 = "boggle.playerIdentity.v1";

const PLAYER_FRUITS_V902 = [
  { value: "🍓", label: "Fraise" },
  { value: "🍊", label: "Orange" },
  { value: "🍋", label: "Citron" },
  { value: "🍐", label: "Poire" },
  { value: "🍎", label: "Pomme" },
  { value: "🍇", label: "Raisin" },
  { value: "🍒", label: "Cerise" },
  { value: "🥝", label: "Kiwi" },
  { value: "🍍", label: "Ananas" },
  { value: "🍉", label: "Pastèque" },
];

function getDefaultFruitV902() {
  return PLAYER_FRUITS_V902[0].value;
}

function isKnownFruitV902(fruit) {
  return PLAYER_FRUITS_V902.some((item) => item.value === fruit);
}

function normalizePlayerPseudoV902(pseudo) {
  return String(pseudo || "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{M} '\u2019-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function normalizePlayerFruitV902(fruit) {
  const value = String(fruit || "").trim();

  return isKnownFruitV902(value) ? value : "";
}

function normalizePlayerIdentityV902(identity) {
  if (!identity || typeof identity !== "object") {
    return null;
  }

  const pseudo = normalizePlayerPseudoV902(identity.pseudo);
  const fruit = normalizePlayerFruitV902(identity.fruit);

  if (!pseudo || !fruit) {
    return null;
  }

  return {
    pseudo,
    fruit,
  };
}

function readPlayerIdentityV902() {
  try {
    return normalizePlayerIdentityV902(
      JSON.parse(localStorage.getItem(PLAYER_IDENTITY_STORAGE_KEY_V902) || "null")
    );
  } catch {
    return null;
  }
}

function getLegacyPseudoV902() {
  const saved = loadLocalSettings();
  let value = String(
    state.playerName ||
    saved.playerName ||
    ""
  ).trim();

  /*
   * Nettoyage des anciennes valeurs du type "🍒 🍉 Miche".
   * Le fruit doit rester une option séparée, jamais une partie du pseudo.
   */
  let changed = true;

  while (changed) {
    changed = false;

    for (const fruit of PLAYER_FRUITS_V902) {
      if (value.startsWith(fruit.value)) {
        value = value.slice(fruit.value.length).trim();
        changed = true;
      }
    }
  }

  return normalizePlayerPseudoV902(value);
}

function savePlayerIdentityV902(identity) {
  const normalized = normalizePlayerIdentityV902(identity);

  if (!normalized) {
    return null;
  }

  localStorage.setItem(
    PLAYER_IDENTITY_STORAGE_KEY_V902,
    JSON.stringify(normalized)
  );

  saveLocalString(STORAGE_KEYS.playerName, normalized.pseudo);
  saveLocalString(STORAGE_KEYS.playerName, normalized.pseudo);

  updatePlayerIdentityOptionsV902();

  return normalized;
}

function formatPlayerNameV902(identity = readPlayerIdentityV902()) {
  const normalized = normalizePlayerIdentityV902(identity);

  if (!normalized) {
    return getStoredPlayerNameV901();
  }

  return normalized.fruit + " " + normalized.pseudo;
}

function getPlayerIdentityReasonTextV902(reason) {
  if (reason === "public") {
    return "Choisissez votre joueur pour rejoindre un salon public.";
  }

  if (reason === "private") {
    return "Choisissez votre joueur pour rejoindre un salon privé.";
  }

  if (reason === "daily-score") {
    return "Choisissez votre joueur pour enregistrer votre score.";
  }

  return "Choisissez votre joueur.";
}

function ensurePlayerIdentityModalV902() {
  let modal = document.querySelector("#player-identity-modal-v902");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.id = "player-identity-modal-v902";
  modal.className = "player-identity-modal-v902";
  modal.hidden = true;
  modal.innerHTML = [
    '<div class="player-identity-modal-v902-card" role="dialog" aria-modal="true" aria-labelledby="player-identity-modal-title-v902">',
      '<h2 id="player-identity-modal-title-v902">Votre joueur</h2>',
      '<p id="player-identity-modal-text-v902">Choisissez votre pseudo et votre fruit.</p>',
      '<form id="player-identity-form-v902">',
        '<label class="player-identity-field-v902" for="player-identity-pseudo-v902">',
          '<span>Pseudo</span>',
          '<input id="player-identity-pseudo-v902" type="text" autocomplete="off" maxlength="24" required>',
        '</label>',
        '<fieldset class="player-identity-fruits-v902">',
          '<legend>Fruit</legend>',
          '<div class="player-identity-fruit-list-v902"></div>',
        '</fieldset>',
        '<p id="player-identity-error-v902" class="player-identity-error-v902" hidden></p>',
        '<div class="player-identity-actions-v902">',
          '<button class="ui-button" type="button" data-player-identity-action="cancel">Annuler</button>',
          '<button class="ui-button primary-button" type="submit">Continuer</button>',
        '</div>',
      '</form>',
    '</div>',
  ].join("");

  document.body.append(modal);

  const fruitList = modal.querySelector(".player-identity-fruit-list-v902");

  for (const fruit of PLAYER_FRUITS_V902) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-identity-fruit-v902";
    button.dataset.fruit = fruit.value;
    button.textContent = fruit.value;
    button.setAttribute("aria-label", fruit.label);
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      setSelectedFruitInModalV902(modal, fruit.value);
    });

    fruitList.append(button);
  }

  return modal;
}

function setSelectedFruitInModalV902(modal, fruit) {
  const normalizedFruit = normalizePlayerFruitV902(fruit) || getDefaultFruitV902();

  modal.dataset.selectedFruit = normalizedFruit;

  for (const button of modal.querySelectorAll("[data-fruit]")) {
    const selected = button.dataset.fruit === normalizedFruit;

    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-selected", selected);
  }
}

function closePlayerIdentityModalV902(modal) {
  modal.hidden = true;
  document.body.classList.remove("player-identity-modal-open-v902");
}

function requestPlayerIdentityV902({ reason = "default" } = {}) {
  const existing = readPlayerIdentityV902();

  if (existing) {
    return Promise.resolve(existing);
  }

  const modal = ensurePlayerIdentityModalV902();
  const form = modal.querySelector("#player-identity-form-v902");
  const input = modal.querySelector("#player-identity-pseudo-v902");
  const text = modal.querySelector("#player-identity-modal-text-v902");
  const error = modal.querySelector("#player-identity-error-v902");
  const cancel = modal.querySelector('[data-player-identity-action="cancel"]');

  attachPseudoInputSanitizerV902(input);

  const legacyPseudo = getLegacyPseudoV902();

  text.textContent = getPlayerIdentityReasonTextV902(reason);
  input.value = legacyPseudo;
  error.hidden = true;
  error.textContent = "";
  setSelectedFruitInModalV902(modal, getDefaultFruitV902());

  modal.hidden = false;
  document.body.classList.add("player-identity-modal-open-v902");

  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 0);

  return new Promise((resolve) => {
    form.onsubmit = (event) => {
      event.preventDefault();

      const identity = savePlayerIdentityV902({
        pseudo: input.value,
        fruit: modal.dataset.selectedFruit,
      });

      if (!identity) {
        error.textContent = "Indiquez un pseudo et choisissez un fruit.";
        error.hidden = false;
        return;
      }

      closePlayerIdentityModalV902(modal);
      resolve(identity);
    };

    cancel.onclick = () => {
      closePlayerIdentityModalV902(modal);
      resolve(null);
    };
  });
}

function getPlayerIdentityOptionsTargetV902() {
  const panel = document.querySelector("#player-preferences");

  if (!panel) {
    return null;
  }

  const soundControl = panel.querySelector("#personal-sound-enabled");
  const inferredBody = soundControl ? soundControl.closest("label")?.parentElement : null;

  return inferredBody || panel;
}

function setupPlayerIdentityOptionsV902() {
  const target = getPlayerIdentityOptionsTargetV902();

  if (!target || target.querySelector("#player-identity-options-v902")) {
    return;
  }

  const section = document.createElement("section");
  section.id = "player-identity-options-v902";
  section.className = "player-identity-options-v902";
  section.innerHTML = [
    '<h3>Joueur</h3>',
    '<p class="player-identity-help-v902">Ce pseudo et ce fruit seront réutilisés pour les salons publics, les salons privés et les classements.</p>',
    '<label class="player-identity-field-v902" for="player-identity-options-pseudo-v902">',
      '<span>Pseudo</span>',
      '<input id="player-identity-options-pseudo-v902" type="text" autocomplete="off" maxlength="24" placeholder="Votre pseudo">',
    '</label>',
    '<fieldset class="player-identity-fruits-v902">',
      '<legend>Fruit</legend>',
      '<div class="player-identity-options-fruit-list-v902"></div>',
    '</fieldset>',
    '<p id="player-identity-options-status-v902" class="player-identity-options-status-v902" aria-live="polite"></p>',
  ].join("");

  target.append(section);

  const fruitList = section.querySelector(".player-identity-options-fruit-list-v902");

  for (const fruit of PLAYER_FRUITS_V902) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-identity-fruit-v902";
    button.dataset.fruit = fruit.value;
    button.textContent = fruit.value;
    button.setAttribute("aria-label", fruit.label);
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      const input = section.querySelector("#player-identity-options-pseudo-v902");
      const identity = savePlayerIdentityV902({
        pseudo: input.value,
        fruit: fruit.value,
      });

      if (!identity) {
        section.dataset.selectedFruit = fruit.value;
        updatePlayerIdentityOptionsV902();
      }
    });

    fruitList.append(button);
  }

  const input = section.querySelector("#player-identity-options-pseudo-v902");

  attachPseudoInputSanitizerV902(input);

  input.addEventListener("input", () => {
    const selectedFruit = section.dataset.selectedFruit || readPlayerIdentityV902()?.fruit || getDefaultFruitV902();

    savePlayerIdentityV902({
      pseudo: input.value,
      fruit: selectedFruit,
    });

    updatePlayerIdentityOptionsV902();
  });

  updatePlayerIdentityOptionsV902();
}

function updatePlayerIdentityOptionsV902() {
  const section = document.querySelector("#player-identity-options-v902");

  if (!section) {
    return;
  }

  const identity = readPlayerIdentityV902();
  const input = section.querySelector("#player-identity-options-pseudo-v902");
  const status = section.querySelector("#player-identity-options-status-v902");
  const fallbackPseudo = getLegacyPseudoV902();
  const selectedFruit = identity?.fruit || section.dataset.selectedFruit || getDefaultFruitV902();

  section.dataset.selectedFruit = selectedFruit;

  if (input && document.activeElement !== input) {
    input.value = identity?.pseudo || fallbackPseudo || "";
  }

  for (const button of section.querySelectorAll("[data-fruit]")) {
    const selected = button.dataset.fruit === selectedFruit;

    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-selected", selected);
  }

  if (status) {
    status.textContent = identity
      ? "Identité enregistrée : " + formatPlayerNameV902(identity)
      : "Aucune identité complète enregistrée.";
  }
}

/* V90.2.1-PLAYER-IDENTITY-UI-FIXES START */

function attachPseudoInputSanitizerV902(input) {
  if (!input || input.dataset.pseudoSanitizerV902 === "true") {
    return;
  }

  input.dataset.pseudoSanitizerV902 = "true";
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("spellcheck", "false");
  input.setAttribute("inputmode", "text");

  input.addEventListener("input", () => {
    const cleaned = normalizePlayerPseudoV902(input.value);

    if (input.value !== cleaned) {
      input.value = cleaned;
    }
  });
}

function startPlayerIdentityOptionsObserverV902() {
  if (window.__playerIdentityOptionsObserverV902) {
    setupPlayerIdentityOptionsV902();
    updatePlayerIdentityOptionsV902();
    return;
  }

  let pending = false;

  const setup = () => {
    if (pending) {
      return;
    }

    pending = true;

    window.requestAnimationFrame(() => {
      pending = false;
      setupPlayerIdentityOptionsV902();
      updatePlayerIdentityOptionsV902();
    });
  };

  window.__playerIdentityOptionsObserverV902 = new MutationObserver(() => {
    const panel = document.querySelector("#player-preferences");

    if (panel && !panel.querySelector("#player-identity-options-v902")) {
      setup();
    }
  });

  window.__playerIdentityOptionsObserverV902.observe(document.body, {
    childList: true,
    subtree: true,
  });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target ? target.closest("button, [role='button']") : null;
    const text = button ? button.textContent.trim().toLowerCase() : "";

    if (text.includes("option") || text.includes("réglage")) {
      setup();
      window.setTimeout(setup, 80);
    }
  });

  setup();
}

/* V90.2.1-PLAYER-IDENTITY-UI-FIXES END */

/* V90.2.3-ROLLBACK-SHARED-OPTIONS START */

/*
 * Rollback ciblé v90.2.2 :
 * - suppression des sélecteurs larges sur tous les panneaux d'options ;
 * - retour à une seule cible sûre : #player-preferences ;
 * - observer limité et sans écoute d'attributs pour éviter les boucles DOM.
 */

/* V90.2.3-ROLLBACK-SHARED-OPTIONS END */

/* V90.2-PLAYER-IDENTITY END */

function getTechnicalPlayerNameV901() {
  /*
   * Si une identité joueur locale existe, elle devient la source de vérité.
   * Sinon on garde un nom technique temporaire pour les flux qui n'ont pas encore besoin d'identité.
   */
  const identity = readPlayerIdentityV902();

  if (identity) {
    return formatPlayerNameV902(identity);
  }

  return getStoredPlayerNameV901();
}

function setSessionContextV901(context) {
  state.gameContext = context;

  document.body.classList.toggle("game-context-solo", context === GAME_CONTEXTS_V901.SOLO);
  document.body.classList.toggle("game-context-daily", context === GAME_CONTEXTS_V901.DAILY);
  document.body.classList.toggle("game-context-public", context === GAME_CONTEXTS_V901.PUBLIC);
  document.body.classList.toggle("game-context-private", context === GAME_CONTEXTS_V901.PRIVATE);
}

function isSocketForRoomOpenOrOpeningV901(roomId) {
  return Boolean(
    state.socket &&
    state.roomId === roomId &&
    (
      state.socket.readyState === WebSocket.CONNECTING ||
      state.socket.readyState === WebSocket.OPEN
    )
  );
}

function connectToSessionV901({
  roomId,
  playerName,
  context = GAME_CONTEXTS_V901.MANUAL,
  persistRoom = false,
  persistPlayerName = false,
  updateUrl = true,
} = {}) {
  const normalizedRoomId = normalizeSessionRoomIdV901(roomId);
  const normalizedPlayerName = normalizeSessionPlayerNameV901(playerName);

  setSessionContextV901(context);

  return connectToRoom({
    roomId: normalizedRoomId,
    playerName: normalizedPlayerName,
    context,
    persistRoom,
    persistPlayerName,
    updateUrl,
  });
}

function getPrivateRoomValueV901({ createIfMissing = false } = {}) {
  const privateRoomInput = getPrivateRoomInputV89();

  if (!privateRoomInput) {
    return "";
  }

  let roomValue = normalizeRoomCodeV89(privateRoomInput.value);

  if (!roomValue && createIfMissing) {
    roomValue = createPrivateRoomCodeV89();
    privateRoomInput.value = roomValue;
  }

  return roomValue;
}



function validatePrivateSessionV901({ createIfMissing = false } = {}) {
  const privateRoomInput = getPrivateRoomInputV89();

  const roomValue = getPrivateRoomValueV901({ createIfMissing });

  if (!roomValue) {
    setPrivateNoticeV89("Indiquez un code de salon ou créez un nouveau salon.");

    if (privateRoomInput) {
      privateRoomInput.focus();
    }

    return null;
  }

  return {
    roomId: roomValue,
  };
}

/* V90.1-CLEAN-SESSION END */

function connectToRoom(options = {}) {
  const roomId = normalizeSessionRoomIdV901(options.roomId, "TEST");
  const playerName = normalizeSessionPlayerNameV901(options.playerName, "joueur");
  const context = options.context || GAME_CONTEXTS_V901.MANUAL;
  const shouldPersistRoom = options.persistRoom === true;
  const shouldPersistPlayerName = options.persistPlayerName !== false;
  const shouldUpdateUrl = options.updateUrl !== false;

const clientId = getOrCreateClientId();

  if (shouldPersistRoom) {
    saveLocalString(STORAGE_KEYS.lastRoomId, roomId);
  }

  if (shouldPersistPlayerName) {
    saveLocalString(STORAGE_KEYS.playerName, playerName);
  }

  if (isSocketForRoomOpenOrOpeningV901(roomId)) {
    addLog(logElement, "[système] Session déjà ouverte pour cette partie.");
    return state.socket;
  }

  if (state.socket) {
    state.socket.close();
  }

  stopLocalTimer();
  resetGameUiToWaiting();

  state.roomId = roomId;
  state.playerName = playerName;

  if (shouldUpdateUrl) {
    updateRoomUrl(roomId);
  }

  updateInviteButton();

  const { socket, url } = createRoomSocket(roomId);
  state.socket = socket;
  renderRulesSummary();

  socket.addEventListener("open", () => {
    if (state.socket !== socket) {
      return;
    }

    updateInviteButton();
    updateHostControls();
    renderRulesSummary();

    addLog(logElement, "Session ouverte : " + url);

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

    document.body.classList.remove("boggle-session-connected");
    state.socket = null;
    updateInviteButton();
    startButton.disabled = true;
    renderRulesSummary();
    stopLocalTimer();
    addLog(logElement, "Session fermée.");
  });

  socket.addEventListener("error", () => {
    if (state.socket !== socket) {
      return;
    }

    addLog(logElement, "Erreur WebSocket.");
  });

  return socket;
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

  // F9G-HOST-CONTROLS-NO-MODE-PANEL : updateHostControls ne doit pas réveiller l’ancien panneau de modes.
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

function createPlayerRow(player, rank) {
  const item = document.createElement("li");
  item.className = player.id === state.playerId
    ? "player-row player-row-current"
    : "player-row";
  item.classList.add("boggle-player-list-item");

  const nameLine = document.createElement("span");
  nameLine.className = "player-name-line";
  nameLine.classList.add("boggle-player-name-line");

  const rankElement = document.createElement("span");
  rankElement.className = "player-rank";
  rankElement.textContent = `${rank}.`;

  const name = document.createElement("strong");
  name.textContent = player.name;
  name.classList.add("boggle-player-name-text");

  nameLine.append(rankElement, name);

  const badges = document.createElement("span");
  badges.className = "player-badges";

  if (player.id === state.playerId) {
    const selfBadge = createPlayerBadge("Vous");
    selfBadge.classList.add("boggle-player-badge-self");
    badges.append(selfBadge);
  }

  if (player.isHost) {
    const hostBadge = createPlayerBadge("Hôte");
    hostBadge.classList.add("boggle-player-badge-host");
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
  badge.classList.add("boggle-player-badge-score");

  return badge;
}

function handleServerMessage(data) {
  if (data.type === "connected") {
    state.playerId = data.playerId;
    state.selectedFoundWordsPlayerId = data.playerId;
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
  element.classList.add("boggle-scroll-panel-runtime");

  const viewer = document.createElement("div");
  viewer.className = "found-words-viewer";

  const canSelectPlayer = canSelectFoundWordsPlayer();

  // V83 : marque le mode live/end du panneau mots trouvés
  element.classList.toggle("found-words-live-mode", !canSelectPlayer);
  element.classList.toggle("found-words-end-mode", canSelectPlayer);

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

  // V83 : libellé spécifique pour les mots trop courts
  const rejectedWord = String(data.word ?? state.selectedWord ?? wordInput.value ?? "").trim();
  const isTooShortWord = rejectedWord.length > 0 && rejectedWord.length < 3;

  const alreadyTriedInvalid =
    feedbackType === "invalid" && !penalty && String(data.reason || "").includes("Déjà tenté");

  setWordFeedback(
    wordFeedbackElement,
    isTooShortWord
      ? "Mot trop court"
      : feedbackType === "invalid"
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
  /*
   * V90.2.8D1b :
   * L'ancien panneau Options joueur / Confort personnel n'est plus rendu.
   * Les options joueur sont gérées par l'overlay global.
   */
  for (const panel of document.querySelectorAll("#player-preferences")) {
    panel.remove();
  }
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
  level.textContent = getRulesHelpLevelLabel(visibleHelpLevel, maxHelpLevel);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "rules-help-button-v22";
  button.disabled = maxHelpLevel <= 0;
  button.textContent = getRulesHelpButtonLabel(visibleHelpLevel, maxHelpLevel);
  button.addEventListener("click", handleRulesHelpButtonClickV22);

  actions.append(level, button);

  const content = document.createElement("div");
  content.className = "rules-help-content-v22";

  const title = document.createElement("p");
  title.className = "rules-help-content-title-v22";
  title.textContent = getRulesHelpContentTitle(visibleHelpLevel, maxHelpLevel);

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
  const feedbackElement = document.querySelector("#word-feedback");

  if (!center) {
    return;
  }

  const centerStyle = window.getComputedStyle(center);
  const paddingLeft = Number.parseFloat(centerStyle.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(centerStyle.paddingRight) || 0;

  const centerWidth =
    center.clientWidth ||
    center.getBoundingClientRect().width ||
    window.innerWidth;

  const horizontalSpace = Math.max(
    220,
    centerWidth - paddingLeft - paddingRight - 8
  );

  function stableOuterHeight(element, fallback = 0) {
    if (!element) {
      return fallback;
    }

    const style = window.getComputedStyle(element);

    if (style.display === "none") {
      return 0;
    }

    const marginTop = Number.parseFloat(style.marginTop) || 0;
    const marginBottom = Number.parseFloat(style.marginBottom) || 0;
    const minHeight = Number.parseFloat(style.minHeight) || 0;
    const height = element.offsetHeight || minHeight || fallback;

    return height + marginTop + marginBottom;
  }

  /*
   * V85.1 : le calcul vertical ne dépend plus de la position visible
   * du plateau dans le viewport. Sinon, un clic avec la grille partiellement
   * visible par le haut ou par le bas provoque des tailles opposées.
   */
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
  const isNarrow = window.innerWidth <= 760;
  const isShort = viewportHeight <= 760;

  const statusHeight = stableOuterHeight(statusPanel, isNarrow ? 86 : 56);
  const formHeight = stableOuterHeight(wordForm, isNarrow ? 96 : 58);

  /*
   * La zone feedback est réservée en CSS. On prend sa hauteur minimale stable,
   * pas sa hauteur de contenu, pour éviter les variations à chaque message.
   */
  const feedbackStyle = feedbackElement ? window.getComputedStyle(feedbackElement) : null;
  const feedbackMinHeight = feedbackStyle
    ? Number.parseFloat(feedbackStyle.minHeight) || 0
    : 0;

  const chromeReserve = isNarrow
    ? 108
    : isShort
      ? 92
      : 128;

  /*
   * V85.2 : on accepte de faire scroller la page plutôt que de réduire
   * le plateau jusqu'à une taille inutilisable.
   */
  const minimumUsableBoardSize = isNarrow ? 280 : 330;

  const verticalSpace = Math.max(
    minimumUsableBoardSize,
    viewportHeight - statusHeight - formHeight - feedbackMinHeight - chromeReserve
  );

  const minBoardSize = minimumUsableBoardSize;
  const maxBoardSize = isNarrow ? 620 : 690;

  const boardSize = Math.floor(
    Math.max(
      minBoardSize,
      Math.min(horizontalSpace, verticalSpace, maxBoardSize)
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

function getPublicRestartEndScreenMessageV9E() {
  if (state.gameContext !== GAME_CONTEXTS_V901.PUBLIC) {
    return "";
  }

  if (state.gameStatus !== "ended") {
    return "";
  }

  return "Nouvelle partie publique dans 15 secondes.";
}

function renderCurrentEndScreen() {
  renderEndScreen(boardElement, {
    players: state.players,
    currentPlayerId: state.playerId,
    maxScore: state.solutionsStats?.maxScore ?? 0,
    totalWords: state.solutionsStats?.totalWords ?? 0,
    durationSeconds: getElapsedDurationSeconds(),
    restartMessage: getPublicRestartEndScreenMessageV9E(),
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

/* V87-HOME-SCREEN START */

/*
 * V87 — nouvel accueil.
 *
 * L'écran existant reste intact : il est simplement masqué tant que
 * l'utilisateur est sur le hub d'accueil.
 */

function createHomePreviewLettersV87() {
  const pool = "AAAAABBCCDDEEEEEEEFFGHIJKLMNOOOPQRSTUUVV";
  const letters = pool.split("");

  for (let index = letters.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = letters[index];

    letters[index] = letters[swapIndex];
    letters[swapIndex] = current;
  }

  return letters.slice(0, 16);
}

function getDailyRoomIdV87() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return "grille-du-jour-" + year + "-" + month + "-" + day;
}

function setHomeNoticeV87(message) {
  const notice = document.querySelector("#home-v87-notice");

  if (!notice) {
    return;
  }

  notice.textContent = message;
  notice.hidden = false;

  window.setTimeout(() => {
    if (notice.textContent === message) {
      notice.hidden = true;
    }
  }, 4800);
}

function showGameFromHomeV87() {
  document.body.classList.remove("v87-home-active");
  document.body.classList.add("v87-game-active");

  if (typeof scheduleBoardFitV31 === "function") {
    scheduleBoardFitV31();
  }
}



function waitAndStartDailyGridFromHomeV9() {
  let attempts = 0;
  const maxAttempts = 80;

  const interval = window.setInterval(() => {
    attempts += 1;

    if (startButton && !startButton.disabled) {
      window.clearInterval(interval);
      startButton.click();
      return;
    }

    if (attempts >= maxAttempts) {
      window.clearInterval(interval);
      setHomeNoticeV87("Ouverture de la partie : cliquez sur Lancer une grille si la partie ne démarre pas automatiquement.");
    }
  }, 100);
}

function startDailyGridFromHomeV87() {
  const roomId = getDailyRoomIdV87();

  showGameFromHomeV87();

  connectToSessionV901({
    roomId,
    playerName: getTechnicalPlayerNameV901(),
    context: GAME_CONTEXTS_V901.DAILY,
    persistRoom: false,
    persistPlayerName: false,
    updateUrl: false,
  });

  waitAndStartDailyGridFromHomeV9();
}

function openPrivateRoomFromHomeV87() {
  openPrivateRoomScreenV89();
}

function openSoloFromHomeV87() {
  /*
   * F1 :
   * Le mode solo ne doit plus dépendre d'un clic manuel sur l'ancien bouton de connexion.
   * On ouvre une session technique solo, puis on laisse l'écran règles /
   * lancement existant s'afficher quand la socket est prête.
   *
   * Aucun DOM legacy n'est supprimé dans cette étape.
   */
  const clientId = getOrCreateClientId();
  const roomId = normalizeSessionRoomIdV901(
    `solo-${clientId}`,
    "solo"
  );

  showGameFromHomeV87();

  connectToSessionV901({
    roomId,
    playerName: getTechnicalPlayerNameV901(),
    context: GAME_CONTEXTS_V901.SOLO,
    persistRoom: false,
    persistPlayerName: false,
    updateUrl: false
  });

  let attempts = 0;
  const maxAttempts = 80;

  const interval = window.setInterval(() => {
    attempts += 1;

    const launchPanel = document.querySelector("#launch-panel");

    if (launchPanel && launchPanel.hidden === false) {
      if (startButton && !startButton.disabled) {
        startButton.focus();
      }

      window.clearInterval(interval);
      return;
    }

    if (attempts >= maxAttempts) {
      window.clearInterval(interval);
      setHomeNoticeV87("Ouverture du mode solo en cours : réessayez dans un instant si l’écran de lancement n’apparaît pas.");
    }
  }, 100);
}


function setupHomeScreenV87() {
  if (document.querySelector("#home-v87")) {
    return;
  }

  const home = document.createElement("section");

  home.id = "home-v87";
  home.className = "home-v87";
  home.setAttribute("aria-label", "Accueil Boggle");

  home.innerHTML = [
    '<div class="home-v87-shell">',
      '<header class="home-v87-header">',
        '<div class="home-v87-logo" aria-label="Boggle">',
          '<span class="home-v87-logo-text">Boggle</span>',
          '<span class="home-v87-logo-dots" aria-hidden="true"><span></span><span></span><span></span></span>',
        '</div>',
        '<nav class="home-v87-actions" aria-label="Actions rapides">',
        '</nav>',
      '</header>',

      '<div id="home-v87-notice" class="home-v87-notice" hidden></div>',

      '<main class="home-v87-main">',
        '<section class="home-v87-hero" aria-labelledby="home-v87-daily-title">',
          '<div class="home-v87-hero-copy">',
            '<p class="home-v87-eyebrow">',
              '<span aria-hidden="true">📅</span>',
              '<span>Défi quotidien</span>',
            '</p>',
            '<h1 id="home-v87-daily-title">Grille du jour</h1>',
            '<p class="home-v87-subtitle">Trouvez un maximum de mots dans la grille du jour&nbsp;!</p>',
            '<button class="home-v87-primary-button ui-button" type="button" data-home-action="daily">',
              '<span aria-hidden="true">▶</span>',
              '<span>Jouer</span>',
            '</button>',
          '</div>',
          '<div class="home-v87-board-wrap" aria-hidden="true">',
            '<div class="home-v87-board"></div>',
          '</div>',
          '<div class="home-v87-fruit home-v87-fruit-orange" aria-hidden="true">🍊</div>',
          '<div class="home-v87-fruit home-v87-fruit-apple" aria-hidden="true">🍎</div>',
        '</section>',

        '<aside class="home-v87-top" aria-labelledby="home-v87-top-title">',
          '<div class="home-v87-card-heading">',
            '<span aria-hidden="true">🏆</span>',
            '<h2 id="home-v87-top-title">Top du jour</h2>',
            '<button class="home-v87-secondary-button ui-button" type="button" data-home-action="top">Voir tout</button>',
          '</div>',
          '<ol class="home-v87-ranking">',
            '<li><span class="home-v87-rank home-v87-gold">1</span><span class="home-v87-avatar">🍊</span><strong>Lulu</strong><span>1457</span></li>',
            '<li><span class="home-v87-rank home-v87-silver">2</span><span class="home-v87-avatar">🍑</span><strong>Mango</strong><span>1120</span></li>',
            '<li><span class="home-v87-rank home-v87-bronze">3</span><span class="home-v87-avatar">🥝</span><strong>Kiwi</strong><span>1054</span></li>',
            '<li><span class="home-v87-rank">4</span><span class="home-v87-avatar">🍇</span><strong>Noisette</strong><span>628</span></li>',
            '<li><span class="home-v87-rank">5</span><span class="home-v87-avatar">🍋</span><strong>Citron</strong><span>522</span></li>',
          '</ol>',
        '</aside>',

        '<section class="home-v87-modes" aria-label="Modes de jeu">',
          '<button class="home-v87-mode home-v87-mode-public ui-button" type="button" data-home-action="public">',
            '<span class="home-v87-mode-icon" aria-hidden="true">🌐</span>',
            '<span class="home-v87-mode-text">',
              '<strong>Salon public</strong>',
              '<span>Jouez en ligne avec d’autres joueurs.</span>',
            '</span>',
            '<span class="home-v87-mode-arrow" aria-hidden="true">›</span>',
          '</button>',
          '<button class="home-v87-mode home-v87-mode-private ui-button" type="button" data-home-action="private">',
            '<span class="home-v87-mode-icon" aria-hidden="true">👥</span>',
            '<span class="home-v87-mode-text">',
              '<strong>Salon privé</strong>',
              '<span>Créez une salle et jouez avec vos amis.</span>',
            '</span>',
            '<span class="home-v87-mode-arrow" aria-hidden="true">›</span>',
          '</button>',
          '<button class="home-v87-mode home-v87-mode-solo ui-button" type="button" data-home-action="solo">',
            '<span class="home-v87-mode-icon" aria-hidden="true">👑</span>',
            '<span class="home-v87-mode-text">',
              '<strong>Jouer seul</strong>',
              '<span>Entraînez-vous à votre rythme sur une nouvelle grille.</span>',
            '</span>',
            '<span class="home-v87-mode-arrow" aria-hidden="true">›</span>',
          '</button>',
        '</section>',
      '</main>',
    '</div>',
  ].join("");

  document.body.insertBefore(home, document.body.firstChild);

  const board = home.querySelector(".home-v87-board");
  const letters = createHomePreviewLettersV87();

  for (const letter of letters) {
    const cell = document.createElement("span");
    cell.textContent = letter;
    board.append(cell);
  }

  home.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.homeAction;

    if (action === "daily") {
      startDailyGridFromHomeV87();
      return;
    }

    if (action === "public") {
      openPublicRoomsScreenV88();
      return;
    }

    if (action === "private") {
      openPrivateRoomScreenV89();
      return;
    }

    if (action === "solo") {
      openSoloFromHomeV87();
      return;
    }

    if (action === "top") {
      setHomeNoticeV87("Le classement complet sera ajouté avec la grille du jour.");
      return;
    }
  });

  document.body.classList.add("v87-home-active");
}

setupHomeScreenV87();

/* V87-HOME-SCREEN END */

/* V87.2-HOME-JS-HTML-BRIDGE START */

/*
 * V87.2 :
 * - bouton global de retour à l'accueil ;
 * - permet de quitter les écrans intermédiaires / l'écran de jeu sans recharger.
 */

function leaveActiveGameSessionForHomeV9() {
  const activeSocket = state.socket;

  stopLocalTimer();
  stopCountdownWarning();

  if (
    activeSocket &&
    activeSocket.readyState !== WebSocket.CLOSED &&
    activeSocket.readyState !== WebSocket.CLOSING
  ) {
    try {
      activeSocket.close();
    } catch {
      // Le retour accueil doit rester possible même si la socket refuse la fermeture.
    }
  }

  if (state.socket === activeSocket) {
    state.socket = null;
  }

  document.body.classList.remove("boggle-session-connected");

  state.roomId = "";
  state.playerId = "";
  state.players = [];
  state.selectedFoundWordsPlayerId = "";

  resetGameUiToWaiting();
  renderPlayersWithHostBadges(playersElement, []);
  updateInviteButton();
  updateHostControls();
  renderRulesSummary();
  refreshRightRulesPanel();
}

function shouldConfirmLeaveActiveGameV9() {
  return (
    document.body.classList.contains("v87-game-active") &&
    state.gameStatus === "playing"
  );
}

function confirmLeaveActiveGameForHomeV9() {
  if (!shouldConfirmLeaveActiveGameV9()) {
    return true;
  }

  return window.confirm(
    "Revenir à l’accueil quittera la partie en cours. Continuer ?"
  );
}

function returnToHomeV87() {
  if (!confirmLeaveActiveGameForHomeV9()) {
    return;
  }

  leaveActiveGameSessionForHomeV9();

  document.body.classList.remove("v88-public-active");
  document.body.classList.remove("v89-private-active");
  document.body.classList.add("v87-home-active");
  document.body.classList.remove("v87-game-active");

  const home = document.querySelector("#home-v87");

  if (home) {
    home.scrollIntoView({ block: "start" });
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupHomeReturnButtonV87() {
  if (document.querySelector("#home-v87-return")) {
    return;
  }

  const button = document.createElement("button");

  button.id = "home-v87-return";
  button.className = "home-v87-return ui-button";
  button.type = "button";
  button.textContent = "← Accueil";
  button.setAttribute("aria-label", "Revenir à l'accueil");

  button.addEventListener("click", returnToHomeV87);

  document.body.append(button);
}

setupHomeReturnButtonV87();

/* V87.2-HOME-JS-HTML-BRIDGE END */

/* V88-PUBLIC-ROOMS-SCREEN START */

/*
 * V88 — écran intermédiaire Salon public.
 *
 * Pour l'instant, les salons publics utilisent des rooms temporaires.
 * Le vrai matchmaking / file d'attente pourra être ajouté ensuite.
 */

const PUBLIC_ROOMS_V88 = {
  rapid: {
    room: "public-rapide",
    title: "Partie rapide",
  },
  classic: {
    room: "public-classique",
    title: "Partie classique",
  },
  relaxed: {
    room: "public-detente",
    title: "Partie détente",
  },
};

function cleanupHomeTopButtonV88() {
  document.querySelectorAll('#home-v87 [data-home-action="top"]').forEach((button) => {
    button.remove();
  });
}

function showHomeFromPublicV88() {
  document.body.classList.remove("v88-public-active");
  document.body.classList.remove("v87-game-active");
  document.body.classList.add("v87-home-active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openPublicRoomsScreenV88() {
  setupPublicRoomsScreenV88();

  document.body.classList.remove("v87-home-active");
  document.body.classList.remove("v87-game-active");
  document.body.classList.add("v88-public-active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function startPublicRoomV88(modeKey) {
  const roomConfig = PUBLIC_ROOMS_V88[modeKey];

  if (!roomConfig) {
    return;
  }

  const identity = await requestPlayerIdentityV902({ reason: "public" });

  if (!identity) {
    return;
  }

  document.body.classList.remove("v88-public-active");

  showGameFromHomeV87();

  connectToSessionV901({
    roomId: roomConfig.room,
    playerName: formatPlayerNameV902(identity),
    context: GAME_CONTEXTS_V901.PUBLIC,
    persistRoom: false,
    persistPlayerName: false,
    updateUrl: false,
  });
}

function setupPublicRoomsScreenV88() {
  if (document.querySelector("#public-v88")) {
    return;
  }

  const screen = document.createElement("section");

  screen.id = "public-v88";
  screen.className = "home-v87 public-v88";
  screen.setAttribute("aria-label", "Salons publics");

  screen.innerHTML = [
    '<div class="home-v87-shell public-v88-shell">',
      '<header class="home-v87-header public-v88-header">',
        '<div class="home-v87-logo" aria-label="Boggle">',
          '<span class="home-v87-logo-text">Boggle</span>',
          '<span class="home-v87-logo-dots" aria-hidden="true"><span></span><span></span><span></span></span>',
        '</div>',
        '<nav class="home-v87-actions public-v88-actions" aria-label="Actions rapides">',
          '<button class="home-v87-top-button ui-button" type="button" data-public-action="home">Accueil</button>',
        '</nav>',
      '</header>',

      '<main class="public-v88-main">',
        '<section class="public-v88-intro">',
          '<p class="home-v87-eyebrow"><span aria-hidden="true">🌐</span><span>Multijoueur en ligne</span></p>',
          '<h1>Salon public</h1>',
          '<p>Choisissez un type de partie et rejoignez une room publique. Pour l’instant, ces salons sont des rooms fixes temporaires.</p>',
        '</section>',

        '<section class="public-v88-grid" aria-label="Choix du salon public">',
          '<button class="home-v87-mode public-v88-room public-v88-room-rapid ui-button" type="button" data-public-mode="rapid">',
            '<span class="home-v87-mode-icon" aria-hidden="true">⚡</span>',
            '<span class="home-v87-mode-text">',
              '<strong>Partie rapide</strong>',
              '<span>Un format court pour lancer une partie sans attendre.</span>',
              '<span class="public-v88-chips"><span>Rapide</span><span>Room publique</span></span>',
            '</span>',
            '<span class="home-v87-mode-arrow" aria-hidden="true">›</span>',
          '</button>',

          '<button class="home-v87-mode public-v88-room public-v88-room-classic ui-button" type="button" data-public-mode="classic">',
            '<span class="home-v87-mode-icon" aria-hidden="true">🏆</span>',
            '<span class="home-v87-mode-text">',
              '<strong>Partie classique</strong>',
              '<span>Le mode standard pour jouer contre d’autres joueurs.</span>',
              '<span class="public-v88-chips"><span>Classique</span><span>Room publique</span></span>',
            '</span>',
            '<span class="home-v87-mode-arrow" aria-hidden="true">›</span>',
          '</button>',

          '<button class="home-v87-mode public-v88-room public-v88-room-relaxed ui-button" type="button" data-public-mode="relaxed">',
            '<span class="home-v87-mode-icon" aria-hidden="true">🌿</span>',
            '<span class="home-v87-mode-text">',
              '<strong>Partie détente</strong>',
              '<span>Un salon plus tranquille, pensé pour jouer sans pression.</span>',
              '<span class="public-v88-chips"><span>Détente</span><span>Room publique</span></span>',
            '</span>',
            '<span class="home-v87-mode-arrow" aria-hidden="true">›</span>',
          '</button>',
        '</section>',
      '</main>',
    '</div>',
  ].join("");

  screen.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-public-mode]");

    if (modeButton) {
      startPublicRoomV88(modeButton.dataset.publicMode);
      return;
    }

    const actionButton = event.target.closest("[data-public-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.publicAction;

    if (action === "home") {
      showHomeFromPublicV88();
      return;
    }
  });

  document.body.insertBefore(screen, document.body.firstChild);
}

cleanupHomeTopButtonV88();
setupPublicRoomsScreenV88();

/* V88-PUBLIC-ROOMS-SCREEN END */

/* V89-PRIVATE-ROOM-SCREEN START */

/*
 * V89 — écran intermédiaire Salon privé.
 *
 * Cet écran sert de sas propre avant l'écran de jeu existant.
 * La configuration détaillée des règles reste gérée par l'interface actuelle.
 */

function createPrivateRoomCodeV89() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function getPrivateRoomInputV89() {
  return document.querySelector("#private-v89-room");
}




function getPrivateNoticeV89() {
  return document.querySelector("#private-v89-notice");
}

function setPrivateNoticeV89(message) {
  const notice = getPrivateNoticeV89();

  if (!notice) {
    return;
  }

  notice.textContent = message;
  notice.hidden = false;

  window.setTimeout(() => {
    if (notice.textContent === message) {
      notice.hidden = true;
    }
  }, 4500);
}

function normalizeRoomCodeV89(value) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function fillPrivateFormFromExistingV89() {
  const privateRoomInput = getPrivateRoomInputV89();

  if (!privateRoomInput || privateRoomInput.value.trim()) {
    return;
  }

  const initialRoomId = normalizeRoomCodeV89(getInitialRoomIdFromUrl());

  if (initialRoomId) {
    privateRoomInput.value = initialRoomId;
  }
}





function showHomeFromPrivateV89() {
  document.body.classList.remove("v89-private-active");
  document.body.classList.remove("v88-public-active");
  document.body.classList.remove("v87-game-active");
  document.body.classList.add("v87-home-active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openPrivateRoomScreenV89() {
  setupPrivateRoomScreenV89();
  fillPrivateFormFromExistingV89();

  document.body.classList.remove("v87-home-active");
  document.body.classList.remove("v88-public-active");
  document.body.classList.remove("v87-game-active");
  document.body.classList.add("v89-private-active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function enterPrivateRoomV89({ createIfMissing = false } = {}) {
  const privateSession = validatePrivateSessionV901({ createIfMissing });

  if (!privateSession) {
    return;
  }

  const identity = await requestPlayerIdentityV902({ reason: "private" });

  if (!identity) {
    return;
  }

  document.body.classList.remove("v89-private-active");

  showGameFromHomeV87();

  connectToSessionV901({
    roomId: privateSession.roomId,
    playerName: formatPlayerNameV902(identity),
    context: GAME_CONTEXTS_V901.PRIVATE,
    persistRoom: false,
    persistPlayerName: false,
    updateUrl: true,
  });
}

async function copyPrivateRoomLinkV89() {
  const privateRoomInput = getPrivateRoomInputV89();

  if (!privateRoomInput) {
    return;
  }

  if (!privateRoomInput.value.trim()) {
    privateRoomInput.value = createPrivateRoomCodeV89();
  }

  const roomCode = normalizeRoomCodeV89(privateRoomInput.value);
  const url = new URL(window.location.href);

  url.searchParams.set("room", roomCode);

  try {
    await navigator.clipboard.writeText(url.toString());
    setPrivateNoticeV89("Lien du salon copié.");
  } catch (error) {
    setPrivateNoticeV89("Code du salon : " + roomCode.toUpperCase());
  }
}

function setupPrivateRoomScreenV89() {
  if (document.querySelector("#private-v89")) {
    return;
  }

  const screen = document.createElement("section");

  screen.id = "private-v89";
  screen.className = "home-v87 private-v89";
  screen.setAttribute("aria-label", "Salon privé");

  screen.innerHTML = [
    '<div class="home-v87-shell private-v89-shell">',
      '<header class="home-v87-header private-v89-header">',
        '<div class="home-v87-logo" aria-label="Boggle">',
          '<span class="home-v87-logo-text">Boggle</span>',
          '<span class="home-v87-logo-dots" aria-hidden="true"><span></span><span></span><span></span></span>',
        '</div>',
        '<nav class="home-v87-actions private-v89-actions" aria-label="Actions rapides">',
          '<button class="home-v87-top-button ui-button" type="button" data-private-action="home">Accueil</button>',
        '</nav>',
      '</header>',

      '<main class="private-v89-main">',
        '<section class="private-v89-card">',
          '<div class="private-v89-copy">',
            '<p class="home-v87-eyebrow"><span aria-hidden="true">🔒</span><span>Partie entre amis</span></p>',
            '<h1>Salon privé</h1>',
            '<p>Créez une salle ou rejoignez vos amis grâce à un code de salon.</p>',
          '</div>',

          '<div class="private-v89-form" aria-label="Accès à un salon privé">',

            '<label class="private-v89-field" for="private-v89-room">',
              '<span>Code du salon</span>',
              '<input id="private-v89-room" type="text" autocomplete="off" placeholder="Ex. FRUITS42">',
            '</label>',

            '<div class="private-v89-buttons">',
              '<button class="ui-button private-v89-primary" type="button" data-private-action="create">Créer un salon</button>',
              '<button class="ui-button private-v89-secondary" type="button" data-private-action="join">Rejoindre</button>',
              '<button class="ui-button private-v89-link" type="button" data-private-action="copy">Copier le lien</button>',
            '</div>',

            '<p id="private-v89-notice" class="home-v87-notice private-v89-notice" hidden></p>',

            '<p class="private-v89-helper">Les règles de la partie restent réglables dans l’écran de jeu après avoir rejoint le salon.</p>',
          '</div>',
        '</section>',
      '</main>',
    '</div>',
  ].join("");

  screen.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-private-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.privateAction;

    if (action === "home") {
      showHomeFromPrivateV89();
      return;
    }

    if (action === "create") {
      enterPrivateRoomV89({ createIfMissing: true });
      return;
    }

    if (action === "join") {
      enterPrivateRoomV89();
      return;
    }

    if (action === "copy") {
      copyPrivateRoomLinkV89();
    }
  });

  screen.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  document.body.insertBefore(screen, document.body.firstChild);
}

setupPrivateRoomScreenV89();

/* V89-PRIVATE-ROOM-SCREEN END */

/* V90.2.8C-GLOBAL-OPTIONS-CONTENT START */

/*
 * Étape C : contenu réel de l'overlay Options global.
 *
 * Important :
 * - ne supprime pas encore les anciens boutons Options ;
 * - ne déplace pas #player-preferences ;
 * - réutilise les fonctions V90.2 d'identité joueur ;
 * - utilise des IDs dédiés v908c pour éviter les collisions.
 */

function renderGlobalOptionsContentV908C() {
  const { overlay } = ensureGlobalOptionsOverlayV908B();
  const content = overlay.querySelector(".global-options-content-v908b");
  const headerDescription = overlay.querySelector(".global-options-header-v908b p");

  if (!content) {
    return;
  }

  if (headerDescription) {
    headerDescription.textContent = "Préférences locales de ce navigateur.";
  }

  if (content.dataset.renderedV908C !== "true") {
    content.dataset.renderedV908C = "true";

    content.innerHTML = [
      '<section class="global-options-section-v908c" aria-labelledby="global-options-player-title-v908c">',
        '<h3 id="global-options-player-title-v908c">Joueur</h3>',
        '<p class="global-options-help-v908c">Pseudo et fruit utilisés pour les salons publics, privés et les scores.</p>',
        '<label class="global-options-field-v908c" for="global-options-pseudo-v908c">',
          '<span>Pseudo</span>',
          '<input id="global-options-pseudo-v908c" type="text" autocomplete="nickname" maxlength="24">',
        '</label>',
        '<div class="global-options-fruits-v908c" role="group" aria-label="Choisir un fruit"></div>',
        '<div class="global-options-actions-v908c">',
          '<button id="global-options-save-player-v908c" type="button">Enregistrer le joueur</button>',
          '<p id="global-options-player-notice-v908c" aria-live="polite"></p>',
        '</div>',
      '</section>',
      '<section class="global-options-section-v908c" aria-labelledby="global-options-comfort-title-v908c">',
        '<h3 id="global-options-comfort-title-v908c">Confort</h3>',
        '<label class="global-options-row-v908c">',
          '<span>',
            '<strong>Sons activés</strong>',
            '<small>Active ou coupe les sons sur ce navigateur.</small>',
          '</span>',
          '<input id="global-options-sound-v908c" type="checkbox">',
        '</label>',
        '<label class="global-options-row-v908c global-options-row-stack-v908c">',
          '<span>',
            '<strong>Volume</strong>',
            '<small>Volume des sons locaux.</small>',
          '</span>',
          '<input id="global-options-volume-v908c" type="range" min="0" max="100" step="5">',
        '</label>',
        '<label class="global-options-row-v908c">',
          '<span>',
            '<strong>Effets visuels</strong>',
            '<small>Active ou coupe les animations de feedback.</small>',
          '</span>',
          '<input id="global-options-effects-v908c" type="checkbox">',
        '</label>',
      '</section>',
    ].join("");

    setupGlobalOptionsIdentityControlsV908C(content);
    setupGlobalOptionsComfortControlsV908C(content);
  }

  syncGlobalOptionsIdentityControlsV908C(content);
  syncGlobalOptionsComfortControlsV908C(content);
}

function setupGlobalOptionsIdentityControlsV908C(content) {
  const pseudoInput = content.querySelector("#global-options-pseudo-v908c");
  const fruitList = content.querySelector(".global-options-fruits-v908c");
  const saveButton = content.querySelector("#global-options-save-player-v908c");

  if (!pseudoInput || !fruitList || !saveButton) {
    return;
  }

  if (typeof attachPseudoInputSanitizerV902 === "function") {
    attachPseudoInputSanitizerV902(pseudoInput);
  }

  fruitList.innerHTML = "";

  for (const fruit of PLAYER_FRUITS_V902) {
    const fruitValue = getGlobalOptionsFruitValueV908C1(fruit);
    const fruitLabel = getGlobalOptionsFruitLabelV908C1(fruit, fruitValue);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "global-options-fruit-v908c";
    button.textContent = fruitValue;
    button.dataset.fruit = fruitValue;
    button.title = fruitLabel;
    button.setAttribute("aria-label", `Choisir ${fruitLabel}`);

    button.addEventListener("click", () => {
      fruitList.dataset.selectedFruit = fruitValue;
      syncGlobalOptionsFruitSelectionV908C(content);
      saveGlobalOptionsIdentityV908C(content);
    });

    fruitList.append(button);
  }

  saveButton.addEventListener("click", () => {
    saveGlobalOptionsIdentityV908C(content);
  });

  pseudoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveGlobalOptionsIdentityV908C(content);
    }
  });

  pseudoInput.addEventListener("blur", () => {
    pseudoInput.value = normalizePlayerPseudoV902(pseudoInput.value);
  });
}

function syncGlobalOptionsIdentityControlsV908C(content) {
  const identity = readPlayerIdentityV902();
  const pseudoInput = content.querySelector("#global-options-pseudo-v908c");
  const fruitList = content.querySelector(".global-options-fruits-v908c");

  if (!pseudoInput || !fruitList) {
    return;
  }

  const pseudo = identity?.pseudo || getLegacyPseudoV902();
  const fruit = normalizePlayerFruitV902(
    fruitList.dataset.selectedFruit || identity?.fruit || getDefaultFruitV902()
  );

  if (document.activeElement !== pseudoInput) {
    pseudoInput.value = pseudo;
  }

  fruitList.dataset.selectedFruit = fruit;
  syncGlobalOptionsFruitSelectionV908C(content);
}

function syncGlobalOptionsFruitSelectionV908C(content) {
  const fruitList = content.querySelector(".global-options-fruits-v908c");

  if (!fruitList) {
    return;
  }

  const selectedFruit = normalizePlayerFruitV902(
    fruitList.dataset.selectedFruit || getDefaultFruitV902()
  );

  for (const button of fruitList.querySelectorAll(".global-options-fruit-v908c")) {
    const selected = button.dataset.fruit === selectedFruit;

    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
}

function saveGlobalOptionsIdentityV908C(content) {
  const pseudoInput = content.querySelector("#global-options-pseudo-v908c");
  const fruitList = content.querySelector(".global-options-fruits-v908c");
  const notice = content.querySelector("#global-options-player-notice-v908c");

  if (!pseudoInput || !fruitList) {
    return;
  }

  const identity = savePlayerIdentityV902({
    pseudo: pseudoInput.value,
    fruit: fruitList.dataset.selectedFruit || getDefaultFruitV902(),
  });

  if (!identity) {
    if (notice) {
      notice.textContent = "Indiquez un pseudo pour enregistrer le joueur.";
      notice.dataset.status = "error";
    }

    syncGlobalOptionsFruitSelectionV908C(content);
    return;
  }

  pseudoInput.value = identity.pseudo;
  fruitList.dataset.selectedFruit = identity.fruit;
  syncGlobalOptionsFruitSelectionV908C(content);

  if (notice) {
    notice.textContent = `Joueur enregistré : ${identity.fruit} ${identity.pseudo}`;
    notice.dataset.status = "success";
  }
}

function setupGlobalOptionsComfortControlsV908C(content) {
  const sound = content.querySelector("#global-options-sound-v908c");
  const volume = content.querySelector("#global-options-volume-v908c");
  const effects = content.querySelector("#global-options-effects-v908c");

  if (!sound || !volume || !effects) {
    return;
  }

  sound.addEventListener("change", () => {
    saveGlobalOptionsComfortV908C(content);
  });

  volume.addEventListener("input", () => {
    saveGlobalOptionsComfortV908C(content);
  });

  volume.addEventListener("change", () => {
    saveGlobalOptionsComfortV908C(content);
  });

  effects.addEventListener("change", () => {
    saveGlobalOptionsComfortV908C(content);
  });
}

function syncGlobalOptionsComfortControlsV908C(content) {
  const sound = content.querySelector("#global-options-sound-v908c");
  const volume = content.querySelector("#global-options-volume-v908c");
  const effects = content.querySelector("#global-options-effects-v908c");

  if (!sound || !volume || !effects) {
    return;
  }

  sound.checked = state.playerPreferences.soundEnabled !== false;
  volume.value = String(
    Math.round(clampGlobalOptionsVolumeV908C(state.playerPreferences.masterVolume ?? 0.65) * 100)
  );
  effects.checked = state.playerPreferences.visualEffectsEnabled !== false;
}

function saveGlobalOptionsComfortV908C(content) {
  const sound = content.querySelector("#global-options-sound-v908c");
  const volume = content.querySelector("#global-options-volume-v908c");
  const effects = content.querySelector("#global-options-effects-v908c");

  if (!sound || !volume || !effects) {
    return;
  }

  state.playerPreferences = {
    ...state.playerPreferences,
    soundEnabled: Boolean(sound.checked),
    masterVolume: clampGlobalOptionsVolumeV908C(Number(volume.value) / 100),
    visualEffectsEnabled: Boolean(effects.checked),
  };

  saveLocalJson(STORAGE_KEYS.playerPreferences, state.playerPreferences);
}

function clampGlobalOptionsVolumeV908C(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0.65;
  }

  return Math.min(1, Math.max(0, number));
}

/* V90.2.8C.1-FRUITS-HELPERS START */

function getGlobalOptionsFruitValueV908C1(fruit) {
  if (typeof fruit === "string") {
    return normalizePlayerFruitV902(fruit);
  }

  if (!fruit || typeof fruit !== "object") {
    return getDefaultFruitV902();
  }

  const directKeys = ["value", "emoji", "fruit", "icon", "symbol", "id"];

  for (const key of directKeys) {
    const value = fruit[key];

    if (typeof value === "string" && isKnownFruitV902(value)) {
      return normalizePlayerFruitV902(value);
    }
  }

  for (const value of Object.values(fruit)) {
    if (typeof value === "string" && isKnownFruitV902(value)) {
      return normalizePlayerFruitV902(value);
    }
  }

  return getDefaultFruitV902();
}

function getGlobalOptionsFruitLabelV908C1(fruit, fruitValue) {
  if (!fruit || typeof fruit !== "object") {
    return fruitValue;
  }

  for (const key of ["label", "name", "title", "ariaLabel"]) {
    const value = fruit[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fruitValue;
}

/* V90.2.8C.1-FRUITS-HELPERS END */

/* V90.2.8C-GLOBAL-OPTIONS-CONTENT END */

/* V90.2.8B-GLOBAL-OPTIONS-OVERLAY START */

/*
 * Étape B : bouton Options global + overlay vide.
 *
 * Objectif :
 * - garder le bouton global validé en v90.2.8A ;
 * - ouvrir/fermer un overlay indépendant ;
 * - ne supprimer aucun ancien bouton ;
 * - ne déplacer aucun panneau existant ;
 * - ne pas encore intégrer pseudo, fruit, sons ou effets.
 */

function ensureGlobalOptionsOverlayV908B() {
  let button = document.querySelector("#global-options-button-v908b");
  let overlay = document.querySelector("#global-options-overlay-v908b");

  if (!button) {
    button = document.createElement("button");
    button.id = "global-options-button-v908b";
    button.className = "global-options-button-v908b";
    button.type = "button";
    button.textContent = "Options";
    button.title = "Options globales";
    button.setAttribute("aria-label", "Ouvrir les options globales");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");

    document.body.append(button);
  }

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "global-options-overlay-v908b";
    overlay.className = "global-options-overlay-v908b";
    overlay.hidden = true;

    overlay.innerHTML = [
      '<div class="global-options-backdrop-v908b" data-global-options-close-v908b="true"></div>',
      '<section class="global-options-dialog-v908b" role="dialog" aria-modal="true" aria-labelledby="global-options-title-v908b">',
        '<header class="global-options-header-v908b">',
          '<div>',
            '<h2 id="global-options-title-v908b">Options</h2>',
            '<p>Overlay global indépendant — contenu à intégrer à l’étape suivante.</p>',
          '</div>',
          '<button class="global-options-close-v908b" type="button" data-global-options-close-v908b="true" aria-label="Fermer les options"><span aria-hidden="true">×</span><span>Fermer</span></button>',
        '</header>',
        '<div class="global-options-content-v908b">',
          '<p>Overlay OK.</p>',
        '</div>',
      '</section>',
    ].join("");

    document.body.append(overlay);
  }

  if (button.dataset.boundV908B !== "true") {
    button.dataset.boundV908B = "true";

    button.addEventListener("click", () => {
      openGlobalOptionsOverlayV908B();
    });
  }

  if (overlay.dataset.boundV908B !== "true") {
    overlay.dataset.boundV908B = "true";

    overlay.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest("[data-global-options-close-v908b]")) {
        closeGlobalOptionsOverlayV908B();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) {
        closeGlobalOptionsOverlayV908B();
      }
    });
  }

  return {
    button,
    overlay,
  };
}

function openGlobalOptionsOverlayV908B() {
  const { button, overlay } = ensureGlobalOptionsOverlayV908B();

  renderGlobalOptionsContentV908C();

  overlay.hidden = false;
  button.setAttribute("aria-expanded", "true");

  const firstInput = overlay.querySelector("#global-options-pseudo-v908c");
  const closeButton = overlay.querySelector("[data-global-options-close-v908b]");

  if (firstInput instanceof HTMLElement) {
    firstInput.focus();
  } else if (closeButton instanceof HTMLElement) {
    closeButton.focus();
  }
}

function closeGlobalOptionsOverlayV908B() {
  const { button, overlay } = ensureGlobalOptionsOverlayV908B();

  overlay.hidden = true;
  button.setAttribute("aria-expanded", "false");
  button.focus();
}

function setupGlobalOptionsOverlayV908B() {
  if (!document.body) {
    window.addEventListener("DOMContentLoaded", setupGlobalOptionsOverlayV908B, {
      once: true,
    });
    return;
  }

  ensureGlobalOptionsOverlayV908B();
}

setupGlobalOptionsOverlayV908B();

/* V90.2.8B-GLOBAL-OPTIONS-OVERLAY END */

/* V90.2.8D1L-HOME-ONLY-OUTSIDE-HOME START */

/*
 * D1l :
 * Barre globale source unique.
 * - Options existe toujours.
 * - Accueil est créé uniquement hors accueil.
 * - Accueil est supprimé du DOM sur l'accueil.
 */

function isVisibleElementV908L(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.hidden) {
    return false;
  }

  const style = window.getComputedStyle(element);

  return style.display !== "none" &&
    style.visibility !== "hidden" &&
    element.getClientRects().length > 0;
}

function getGlobalOptionsButtonV908L() {
  return document.querySelector([
    "#global-options-button-v908b",
    ".global-options-button-v908b",
    "#global-options-launcher-v908b",
    ".global-options-launcher-v908b",
    "#global-options-toggle-v908b",
    ".global-options-toggle-v908b",
    "#global-options-open-v908b",
    ".global-options-open-v908b"
  ].join(", "));
}

function ensureGlobalActionsBarV908L() {
  let bar = document.querySelector("#global-actions-bar-v908l");

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "global-actions-bar-v908l";
    bar.className = "global-actions-bar-v908l";
    bar.setAttribute("aria-label", "Actions globales");
    document.body.appendChild(bar);
  }

  return bar;
}

function getCurrentGlobalScreenV908L() {
  if (isVisibleElementV908L(document.querySelector("#private-v89"))) {
    return "private";
  }

  if (isVisibleElementV908L(document.querySelector("#public-v88"))) {
    return "public";
  }

  const home = document.querySelector("#home-v87");

  if (isVisibleElementV908L(home) && document.body.classList.contains("v87-home-active")) {
    return "home";
  }

  if (document.body.classList.contains("v87-game-active")) {
    return "game";
  }

  return "home";
}

function removeLegacyHomeButtonsV908L() {
  const legacyButtons = document.querySelectorAll([
    "#public-v88 [data-public-action=\"home\"]",
    "#private-v89 [data-private-action=\"home\"]",
    "#home-return-v87",
    ".home-return-v87",
    "#home-v87-return",
    ".home-v87-return",
    "#back-home-v87",
    ".back-home-v87",
    "#return-home-v87",
    ".return-home-v87",
    "[data-global-action=\"home\"]",
    "[data-action=\"home\"]"
  ].join(", "));

  for (const button of legacyButtons) {
    if (button.id === "global-home-button-v908l") {
      continue;
    }

    if (/accueil/i.test(button.textContent || "")) {
      button.remove();
    }
  }
}

function ensureGlobalHomeButtonV908L() {
  let button = document.querySelector("#global-home-button-v908l");

  if (!button) {
    button = document.createElement("button");
    button.id = "global-home-button-v908l";
    button.className = "global-action-button-v908l global-home-button-v908l";
    button.type = "button";
    button.textContent = "← Accueil";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const screen = getCurrentGlobalScreenV908L();

      if (screen === "private") {
        if (typeof showHomeFromPrivateV89 === "function") {
          showHomeFromPrivateV89();
        } else {
          document.querySelector("#private-v89")?.remove();
          document.body.classList.add("v87-home-active");
          document.body.classList.remove("v87-game-active");
        }

        syncGlobalActionsBarV908L();
        return;
      }

      if (screen === "public") {
        if (typeof showHomeFromPublicV88 === "function") {
          showHomeFromPublicV88();
        } else {
          document.querySelector("#public-v88")?.remove();
          document.body.classList.add("v87-home-active");
          document.body.classList.remove("v87-game-active");
        }

        syncGlobalActionsBarV908L();
        return;
      }

      if (screen === "game" && typeof returnToHomeV87 === "function") {
        returnToHomeV87();
      }

      syncGlobalActionsBarV908L();
    });
  }

  return button;
}

function removeGlobalHomeButtonOnHomeV908L() {
  const button = document.querySelector("#global-home-button-v908l");

  if (button) {
    button.remove();
  }
}

function cleanupOldGlobalActionsBarsV908L() {
  for (const selector of [
    "#global-actions-bar-v908h",
    "#global-actions-bar-v908j",
    "#global-actions-bar-v908k"
  ]) {
    document.querySelector(selector)?.remove();
  }

  for (const selector of [
    "#global-home-button-v908j",
    "#global-home-button-v908k"
  ]) {
    document.querySelector(selector)?.remove();
  }
}


function normalizeGlobalOptionsButtonV908L(button) {
  if (!(button instanceof HTMLElement)) {
    return;
  }

  /*
   * E1 :
   * Le bouton Options global ne doit plus dépendre des styles historiques
   * .ui-button / home-v87-top-button / player-preferences.
   */
  button.classList.remove(
    "ui-button",
    "home-v87-top-button",
    "global-options-button-v908b-old"
  );

  button.classList.add("global-action-button-v908l");
  button.classList.add("global-options-button-in-bar-v908l");
}

function syncGlobalActionsBarV908L() {
  cleanupOldGlobalActionsBarsV908L();
  removeLegacyHomeButtonsV908L();

  const bar = ensureGlobalActionsBarV908L();
  const optionsButton = getGlobalOptionsButtonV908L();
  const screen = getCurrentGlobalScreenV908L();

  if (screen === "home") {
    removeGlobalHomeButtonOnHomeV908L();
  } else {
    const homeButton = ensureGlobalHomeButtonV908L();

    if (homeButton.parentElement !== bar) {
      bar.appendChild(homeButton);
    }
  }

  if (optionsButton) {
    normalizeGlobalOptionsButtonV908L(optionsButton);

    if (optionsButton.parentElement !== bar) {
      bar.appendChild(optionsButton);
    }
  }

  bar.hidden = !optionsButton && screen === "home";
}

function setupGlobalActionsBarV908L() {
  if (window.__globalActionsBarV908L === true) {
    return;
  }

  window.__globalActionsBarV908L = true;

  let scheduled = false;

  const schedule = () => {
    if (scheduled) {
      return;
    }

    scheduled = true;

    window.requestAnimationFrame(() => {
      scheduled = false;
      syncGlobalActionsBarV908L();
    });
  };

  schedule();

  /*
   * E3 perf :
   * Avant, on observait tout le document avec subtree + attributes.
   * C'était trop coûteux pendant une partie : chaque changement de classe
   * du plateau pouvait relancer la synchronisation de la barre globale.
   *
   * On ne surveille plus que les changements de classe du body, qui sont
   * justement ce qui signale accueil / salon public / salon privé / jeu.
   */
  const observer = new MutationObserver(schedule);

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupGlobalActionsBarV908L, {
    once: true,
  });
} else {
  setupGlobalActionsBarV908L();
}

/* V90.2.8D1L-HOME-ONLY-OUTSIDE-HOME END */

