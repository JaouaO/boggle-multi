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
injectFruityThemeOverrides();
injectMockupCloserTheme();
injectMockupCloserThemeV2();
injectMockupCloserThemeV3();
injectMockupCloserThemeV4();
injectMockupFullWidthThemeV5();
injectMockupFullWidthThemeV6();
injectMockupResponsiveThemeV7();
injectMockupStableTopCleanVictoryThemeV16();
injectMockupRightRulesInputThemeV22();
injectWordsPlayersLayoutV29();
injectFinalRecapHoverV30();
injectBoardFitAndTabsV31();
injectFinalButtonsV34();


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

    #launch-panel > h2 {
      display: none !important;
    }

    #mode-options-toggle {
      width: 100%;
      justify-content: space-between;
      text-align: left;
      margin: 0;
    }

    #mode-options-toggle::after {
      content: "▾";
      margin-left: 0.75rem;
      transition: transform 160ms ease;
    }

    #mode-options-toggle[aria-expanded="false"]::after {
      transform: rotate(-90deg);
    }

    #mode-options-body {
      margin-top: 0.85rem;
    }

    #timer.boggle-timer-ending {
      animation: boggle-timer-warning 0.55s ease-in-out infinite alternate;
      border-color: rgba(180, 35, 24, 0.55) !important;
    }

    @keyframes boggle-timer-warning {
      from {
        transform: translateY(0);
        box-shadow: 0 0 0 0 rgba(180, 35, 24, 0.16);
      }
      to {
        transform: translateY(-1px);
        box-shadow: 0 0 0 0.2rem rgba(180, 35, 24, 0.13);
      }
    }


    .boggle-confetti-piece {
      position: fixed;
      top: -1rem;
      z-index: 21000;
      width: 0.55rem;
      height: 0.85rem;
      border-radius: 0.15rem;
      pointer-events: none;
      animation: boggle-confetti-fall 3.8s linear forwards;
    }

    @keyframes boggle-confetti-fall {
      0% {
        transform: translate3d(0, -1rem, 0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translate3d(var(--confetti-drift), 105vh, 0) rotate(720deg);
        opacity: 0;
      }
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

  `;

  document.head.appendChild(style);
}



function injectFruityThemeOverrides() {
  if (document.querySelector("#boggle-fruity-visual-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-fruity-visual-style";
  style.textContent = `
    :root {
      --fruit-bg: #f7efd9;
      --fruit-bg-2: #f3e4bf;
      --fruit-panel: rgba(255, 250, 236, 0.92);
      --fruit-panel-strong: rgba(255, 250, 239, 0.98);
      --fruit-line: rgba(122, 87, 52, 0.16);
      --fruit-brown: #704223;
      --fruit-brown-soft: #8a5a36;
      --fruit-orange: #ec8a43;
      --fruit-orange-dark: #d66d26;
      --fruit-yellow: #f6d768;
      --fruit-yellow-soft: #fdecb0;
      --fruit-green: #9db978;
      --fruit-green-soft: #dcebc6;
      --fruit-red-soft: #ffe0d5;
      --fruit-shadow: 0 0.7rem 1.6rem rgba(99, 70, 40, 0.08);
      --fruit-font: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
    }

    html, body {
      min-height: 100%;
      background-color: var(--fruit-bg) !important;
      color: var(--fruit-brown) !important;
      font-family: var(--fruit-font);
    }

    body {
      background-image:
        linear-gradient(180deg, rgba(255,255,255,0.42), rgba(244,228,186,0.38)),
        url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27220%27%20viewBox%3D%270%200%20260%20220%27%3E%0A%3Crect%20width%3D%27260%27%20height%3D%27220%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M35%2058c18-14%2034-14%2047%202-16-1-30%206-40%2020%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%278%27%20opacity%3D%27.22%27/%3E%0A%3Cpath%20d%3D%27M54%2076c-9%2011-10%2020-4%2031%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%276%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M194%2042c9%200%2017%206%2021%2015-9-2-18%200-25%207%27%20stroke%3D%27%23A7C287%27%20stroke-width%3D%278%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27174%27%20cy%3D%27140%27%20r%3D%277%27%20fill%3D%27%23F2A76A%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27189%27%20cy%3D%27151%27%20r%3D%275%27%20fill%3D%27%23E7C760%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27203%27%20cy%3D%27139%27%20r%3D%274%27%20fill%3D%27%23E6A97A%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M100%20176h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.14%27/%3E%0A%3Cpath%20d%3D%27M107%20164h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M209%20174c11-6%2019-4%2028%206-10-1-18%201-25%208%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%277%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M121%2077l6%206%206-6%206%206%206-6%27%20stroke%3D%27%23F2B06C%27%20stroke-width%3D%274%27%20opacity%3D%27.16%27/%3E%0A%3C/g%3E%0A%3C/svg%3E") !important;
      background-size: auto, 260px 220px !important;
      background-repeat: repeat, repeat !important;
      background-attachment: fixed, fixed !important;
    }

    #boggle-shell {
      width: min(100%, 108rem) !important;
      padding: 1rem !important;
    }


    #boggle-top {
      position: relative;
      overflow: hidden;
      min-height: 5.25rem;
      padding: 1rem 1.2rem !important;
      background:
        linear-gradient(180deg, rgba(255,252,245,0.98), rgba(251,240,214,0.93)) !important;
    }

    #boggle-top::after {
      content: "";
      position: absolute;
      right: 1rem;
      bottom: 0.15rem;
      width: 15rem;
      height: 5.3rem;
      background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27280%27%20height%3D%2796%27%20viewBox%3D%270%200%20280%2096%27%3E%0A%3Crect%20width%3D%27280%27%20height%3D%2796%27%20fill%3D%27none%27/%3E%0A%3Cg%20opacity%3D%27.95%27%3E%0A%3Cg%20transform%3D%27translate%2812%2012%29%27%3E%0A%3Ccircle%20cx%3D%2734%27%20cy%3D%2744%27%20r%3D%2726%27%20fill%3D%27%23F2A45F%27/%3E%0A%3Ccircle%20cx%3D%2734%27%20cy%3D%2744%27%20r%3D%2724%27%20fill%3D%27%23F2A45F%27%20stroke%3D%27%23DB8A40%27%20stroke-width%3D%272%27/%3E%0A%3Ccircle%20cx%3D%2727%27%20cy%3D%2741%27%20r%3D%272.6%27%20fill%3D%27%236D4124%27/%3E%0A%3Ccircle%20cx%3D%2741%27%20cy%3D%2741%27%20r%3D%272.6%27%20fill%3D%27%236D4124%27/%3E%0A%3Cpath%20d%3D%27M29%2051c4%204%2010%204%2014%200%27%20stroke%3D%27%236D4124%27%20stroke-width%3D%272.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%0A%3Cellipse%20cx%3D%2717%27%20cy%3D%2752%27%20rx%3D%274%27%20ry%3D%275%27%20fill%3D%27%23F8C49A%27%20opacity%3D%27.55%27/%3E%0A%3Cellipse%20cx%3D%2751%27%20cy%3D%2752%27%20rx%3D%274%27%20ry%3D%275%27%20fill%3D%27%23F8C49A%27%20opacity%3D%27.55%27/%3E%0A%3Cpath%20d%3D%27M32%2017c4-8%2011-11%2018-9-2%207-7%2013-15%2016%27%20fill%3D%27%238FB56B%27/%3E%0A%3Cpath%20d%3D%27M36%2018c-6-4-12-4-18-1%203%207%209%2011%2016%2012%27%20fill%3D%27%23A8C881%27/%3E%0A%3C/g%3E%0A%3Cg%20transform%3D%27translate%28104%200%29%27%3E%0A%3Ccircle%20cx%3D%2750%27%20cy%3D%2752%27%20r%3D%2731%27%20fill%3D%27%23F6E9C7%27%20stroke%3D%27%23DFC78F%27%20stroke-width%3D%272%27/%3E%0A%3Ccircle%20cx%3D%2741%27%20cy%3D%2749%27%20r%3D%272.8%27%20fill%3D%27%237C5532%27/%3E%0A%3Ccircle%20cx%3D%2758%27%20cy%3D%2749%27%20r%3D%272.8%27%20fill%3D%27%237C5532%27/%3E%0A%3Cpath%20d%3D%27M43%2060c4%204%2010%204%2014%200%27%20stroke%3D%27%237C5532%27%20stroke-width%3D%272.7%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%0A%3Cellipse%20cx%3D%2731%27%20cy%3D%2759%27%20rx%3D%274.5%27%20ry%3D%275.5%27%20fill%3D%27%23F9DDB8%27%20opacity%3D%27.6%27/%3E%0A%3Cellipse%20cx%3D%2769%27%20cy%3D%2759%27%20rx%3D%274.5%27%20ry%3D%275.5%27%20fill%3D%27%23F9DDB8%27%20opacity%3D%27.6%27/%3E%0A%3Cpath%20d%3D%27M39%2023c8-6%2018-8%2027-4%27%20stroke%3D%27%23D8C085%27%20stroke-width%3D%273%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%0A%3C/g%3E%0A%3Cg%20fill%3D%27%23A7C287%27%20opacity%3D%27.9%27%3E%0A%3Cpath%20d%3D%27M2%2072c10-10%2021-12%2031-6-10%202-18%208-24%2018%27/%3E%0A%3Cpath%20d%3D%27M233%2076c12-10%2024-10%2035%200-11%201-20%206-27%2015%27/%3E%0A%3Cpath%20d%3D%27M248%2058c10-8%2019-8%2028-1-8%202-15%206-20%2014%27/%3E%0A%3C/g%3E%0A%3Cg%20fill%3D%27%23F5BE76%27%20opacity%3D%27.75%27%3E%0A%3Ccircle%20cx%3D%270%27%20cy%3D%2712%27%20r%3D%276%27/%3E%3Ccircle%20cx%3D%27262%27%20cy%3D%2718%27%20r%3D%276%27/%3E%3Ccircle%20cx%3D%27230%27%20cy%3D%2710%27%20r%3D%274%27/%3E%0A%3C/g%3E%0A%3C/g%3E%3C/svg%3E") center / contain no-repeat;
      opacity: 0.95;
      pointer-events: none;
    }

    #connection-controls,
    #connection-actions,
    .connection-control {
      position: relative;
      z-index: 1;
    }

    .connection-field-label,
    #players-panel > h2,
    #found-words-panel > h2,
    #launch-panel > h2,
    #play-status-panel > h2,
    #help-panel > h2 {
      color: var(--fruit-brown) !important;
      font-weight: 900 !important;
      letter-spacing: 0.01em;
    }

    #players-panel > h2::before { content: "👥 "; }
    #found-words-panel > h2::before { content: "📖 "; }
    #play-status-panel > h2::before { content: "🎮 "; }
    #help-panel > h2::before { content: "💡 "; }

    button:not(.board-cell),
    .ui-button {
      border: 1px solid rgba(176, 103, 41, 0.28) !important;
      border-radius: 0.95rem !important;
      background: linear-gradient(180deg, #f39a53, #ea7e33) !important;
      color: #fff8f1 !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.26),
        0 0.3rem 0.75rem rgba(170, 101, 38, 0.14) !important;
      font-weight: 900 !important;
      text-shadow: 0 1px 0 rgba(125, 60, 17, 0.18);
    }

    button:not(.board-cell):hover,
    .ui-button:hover {
      filter: saturate(1.02) brightness(1.02);
      transform: translateY(-1px);
    }

    button:not(.board-cell):disabled,
    .ui-button:disabled {
      background: rgba(233, 205, 159, 0.85) !important;
      color: rgba(112, 66, 35, 0.58) !important;
      border-color: rgba(152, 120, 80, 0.16) !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    #end-game,
    .danger-button {
      background: linear-gradient(180deg, #ef7661, #e65b4f) !important;
      border-color: rgba(166, 46, 38, 0.35) !important;
      color: #fff6f4 !important;
      box-shadow: 0 0.35rem 0.85rem rgba(203, 90, 74, 0.18) !important;
    }

    #player-preferences > button {
      background: linear-gradient(180deg, #f6efe1, #f3e7cd) !important;
      color: var(--fruit-brown) !important;
      border: 1px solid rgba(122,87,52,0.16) !important;
      text-shadow: none !important;
      box-shadow: 0 0.25rem 0.8rem rgba(99,70,40,0.08) !important;
    }

    #player-preferences > button::before {
      content: "⚙️ ";
    }

    #boggle-top input,
    #word-input,
    #mode-controls input,
    #mode-controls select,
    #mode-controls textarea {
      border: 1px solid rgba(122, 87, 52, 0.18) !important;
      border-radius: 0.8rem !important;
      background: rgba(255, 252, 242, 0.96) !important;
      color: var(--fruit-brown) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45) !important;
    }

    .info-badge,
    #game-status,
    #timer,
    #status,
    .rule-pill {
      border: 1px solid rgba(122, 87, 52, 0.12) !important;
      background: rgba(255, 250, 238, 0.96) !important;
      color: var(--fruit-brown) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
      border-radius: 999px !important;
      font-weight: 900 !important;
    }

    #status.connected-badge {
      background: rgba(239, 249, 223, 0.98) !important;
      color: #577e2c !important;
      border-color: rgba(122, 163, 74, 0.22) !important;
    }

    #status.connected-badge::before {
      content: "●";
      color: #77b42b;
      margin-right: 0.45rem;
      font-size: 0.95em;
    }

    #game-status {
      background: rgba(255,252,240,0.98) !important;
      font-size: 1rem;
      padding-inline: 0.95rem !important;
    }

    #timer {
      background: linear-gradient(180deg, #f8e7aa, #f4d66d) !important;
      color: #6b481c !important;
      border-color: rgba(173, 135, 52, 0.18) !important;
      padding-inline: 1rem !important;
      font-size: 1.1rem;
    }

    #board {
      position: relative;
      padding: 1rem !important;
      border-radius: 1.55rem !important;
      background:
        linear-gradient(180deg, rgba(233, 204, 131, 0.82), rgba(217, 178, 99, 0.72)) !important;
      border: 1px solid rgba(147, 103, 50, 0.16) !important;
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.2),
        0 0.9rem 2rem rgba(99,70,40,0.12) !important;
    }

    #board .board-cell {
      border: 1px solid rgba(131, 98, 63, 0.13) !important;
      border-radius: 1rem !important;
      background:
        radial-gradient(circle at 18% 18%, rgba(255,255,255,0.72) 0 0.2rem, transparent 0.22rem),
        radial-gradient(circle at 84% 84%, rgba(223, 198, 154, 0.32) 0 0.18rem, transparent 0.2rem),
        linear-gradient(180deg, #fffaf0, #fdf2da) !important;
      color: #5d361b !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.82),
        0 0.32rem 0.8rem rgba(100, 70, 40, 0.08) !important;
    }

    #board .board-letter {
      color: #6a3e1f !important;
      font-weight: 950 !important;
      text-shadow: 0 1px 0 rgba(255,255,255,0.44);
    }


    .welcome-board {
      padding: 0.8rem;
      border-radius: 1.35rem;
      background: linear-gradient(180deg, rgba(233, 204, 131, 0.72), rgba(217, 178, 99, 0.62));
      border: 1px solid rgba(147, 103, 50, 0.14);
    }

    .welcome-caption {
      margin-top: 0.85rem;
      color: var(--fruit-brown-soft);
      font-weight: 800;
      text-align: center;
    }

    #players-panel,
    #found-words-panel,
    #help-panel,
    #launch-panel,
    #play-status-panel {
      overflow: hidden;
    }

    #players-panel > h2,
    #found-words-panel > h2,
    #help-panel > h2,
    #play-status-panel > h2,
    #launch-panel > h2 {
      margin-bottom: 0.8rem !important;
      font-size: 1rem !important;
    }

    .player-row {
      border-radius: 0.9rem !important;
      padding: 0.18rem 0.35rem !important;
      background: rgba(255, 250, 236, 0.72) !important;
    }

    .player-row:nth-child(1) { background: rgba(249, 223, 127, 0.42) !important; }
    .player-row:nth-child(2) { background: rgba(226, 220, 220, 0.56) !important; }
    .player-row:nth-child(3) { background: rgba(233, 193, 141, 0.48) !important; }

    .player-row-current {
      background: rgba(255, 246, 224, 0.97) !important;
      box-shadow:
        inset 4px 0 0 rgba(239, 146, 58, 0.5),
        0 -0.2rem 0.5rem rgba(90, 59, 35, 0.08) !important;
    }

    .player-rank {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.7rem;
      min-width: 1.7rem;
      height: 1.7rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(122,87,52,0.1);
      font-weight: 900;
    }

    .player-badges .info-badge {
      background: rgba(255, 248, 224, 0.95) !important;
      min-height: 1.3rem !important;
    }

    #found-words {
      scrollbar-color: rgba(190, 149, 97, 0.85) rgba(243, 230, 203, 0.55);
    }

    #found-words::-webkit-scrollbar,
    #players::-webkit-scrollbar,
    #help-slot::-webkit-scrollbar {
      width: 0.55rem;
    }

    #found-words::-webkit-scrollbar-thumb,
    #players::-webkit-scrollbar-thumb,
    #help-slot::-webkit-scrollbar-thumb {
      background: rgba(197, 154, 102, 0.88);
      border-radius: 999px;
    }

    #help-slot {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    #rules-summary {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.55rem !important;
      padding: 0.2rem 0 0.8rem !important;
      margin: 0 0 0.2rem !important;
      border: 0 !important;
      border-bottom: 1px solid rgba(122,87,52,0.08) !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    .rule-pill-danger {
      background: rgba(221, 241, 201, 0.95) !important;
      border-color: rgba(128, 159, 93, 0.24) !important;
      color: #507233 !important;
    }

    .rule-pill-warning {
      background: rgba(255, 226, 217, 0.95) !important;
      border-color: rgba(216, 117, 103, 0.22) !important;
      color: #a44938 !important;
    }

    #help-panel {
      position: relative;
      padding-top: 0.95rem !important;
    }

    #help-panel::after {
      content: "";
      position: absolute;
      right: 0.9rem;
      bottom: 0.65rem;
      width: 4rem;
      height: 4rem;
      background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27220%27%20viewBox%3D%270%200%20260%20220%27%3E%0A%3Crect%20width%3D%27260%27%20height%3D%27220%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M35%2058c18-14%2034-14%2047%202-16-1-30%206-40%2020%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%278%27%20opacity%3D%27.22%27/%3E%0A%3Cpath%20d%3D%27M54%2076c-9%2011-10%2020-4%2031%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%276%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M194%2042c9%200%2017%206%2021%2015-9-2-18%200-25%207%27%20stroke%3D%27%23A7C287%27%20stroke-width%3D%278%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27174%27%20cy%3D%27140%27%20r%3D%277%27%20fill%3D%27%23F2A76A%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27189%27%20cy%3D%27151%27%20r%3D%275%27%20fill%3D%27%23E7C760%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27203%27%20cy%3D%27139%27%20r%3D%274%27%20fill%3D%27%23E6A97A%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M100%20176h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.14%27/%3E%0A%3Cpath%20d%3D%27M107%20164h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M209%20174c11-6%2019-4%2028%206-10-1-18%201-25%208%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%277%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M121%2077l6%206%206-6%206%206%206-6%27%20stroke%3D%27%23F2B06C%27%20stroke-width%3D%274%27%20opacity%3D%27.16%27/%3E%0A%3C/g%3E%0A%3C/svg%3E") center / 140% auto no-repeat;
      opacity: 0.28;
      pointer-events: none;
    }

    #help-panel .help-block,
    #help-panel .help-section,
    #help-panel > div {
      background: rgba(255, 252, 242, 0.68);
      border-radius: 1rem;
      border: 1px solid rgba(122,87,52,0.08);
    }

    #word-form {
      padding: 0.85rem 0.95rem !important;
      border-radius: 1.15rem !important;
      background: linear-gradient(180deg, rgba(255,251,242,0.95), rgba(252,244,225,0.92)) !important;
      border: 1px solid rgba(122,87,52,0.12) !important;
      box-shadow: var(--fruit-shadow) !important;
    }

    #word-feedback {
      color: var(--fruit-brown) !important;
    }

    #launch-panel,
    #play-status-panel,
    #welcome-panel {
      position: relative;
    }

    #launch-panel::before,
    #play-status-panel::before,
    #welcome-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27220%27%20viewBox%3D%270%200%20260%20220%27%3E%0A%3Crect%20width%3D%27260%27%20height%3D%27220%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M35%2058c18-14%2034-14%2047%202-16-1-30%206-40%2020%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%278%27%20opacity%3D%27.22%27/%3E%0A%3Cpath%20d%3D%27M54%2076c-9%2011-10%2020-4%2031%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%276%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M194%2042c9%200%2017%206%2021%2015-9-2-18%200-25%207%27%20stroke%3D%27%23A7C287%27%20stroke-width%3D%278%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27174%27%20cy%3D%27140%27%20r%3D%277%27%20fill%3D%27%23F2A76A%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27189%27%20cy%3D%27151%27%20r%3D%275%27%20fill%3D%27%23E7C760%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27203%27%20cy%3D%27139%27%20r%3D%274%27%20fill%3D%27%23E6A97A%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M100%20176h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.14%27/%3E%0A%3Cpath%20d%3D%27M107%20164h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M209%20174c11-6%2019-4%2028%206-10-1-18%201-25%208%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%277%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M121%2077l6%206%206-6%206%206%206-6%27%20stroke%3D%27%23F2B06C%27%20stroke-width%3D%274%27%20opacity%3D%27.16%27/%3E%0A%3C/g%3E%0A%3C/svg%3E");
      background-size: 260px 220px;
      opacity: 0.11;
      pointer-events: none;
    }

    #launch-panel > *,
    #play-status-panel > *,
    #welcome-panel > * {
      position: relative;
      z-index: 1;
    }

    #found-words-panel,
    #players-panel {
      background: linear-gradient(180deg, rgba(255,252,244,0.97), rgba(249,240,218,0.93)) !important;
    }


    @media (max-width: 72rem) {
      #boggle-top::after {
        opacity: 0.24;
      }
    }

    @media (max-width: 58rem) {
      #boggle-top::after {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupCloserTheme() {
  if (document.querySelector("#boggle-mockup-closer-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-closer-style";
  style.textContent = `
    :root {
      --mk-bg: #f8efd8;
      --mk-panel: #fff8e8;
      --mk-panel-2: #fff2d0;
      --mk-line: rgba(111, 73, 40, 0.18);
      --mk-ink: #5d351e;
      --mk-muted: #8a6a4e;
      --mk-orange: #f07f32;
      --mk-orange-dark: #dd6e28;
      --mk-yellow: #f5d872;
      --mk-yellow-soft: #fff0b9;
      --mk-red: #ef6255;
      --mk-red-soft: #ffe0d8;
      --mk-green: #88b65a;
      --mk-green-soft: #e2f0cc;
      --mk-radius: 1.35rem;
      --mk-pill: 999px;
      --mk-shadow: 0 0.4rem 1.1rem rgba(97, 65, 35, 0.08);
      --mk-font: "Trebuchet MS", "Avenir Next", "Segoe UI", system-ui, sans-serif;
    }

    body > h1,
    main > h1,
    #app > h1 {
      display: none !important;
    }

    html,
    body {
      margin: 0 !important;
      min-height: 100% !important;
      background: var(--mk-bg) !important;
      color: var(--mk-ink) !important;
      font-family: var(--mk-font) !important;
    }

    body {
      background-image:
        url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27220%27%20height%3D%27180%27%20viewBox%3D%270%200%20220%20180%27%3E%0A%3Crect%20width%3D%27220%27%20height%3D%27180%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M30%2048c15-11%2028-10%2040%202-13%200-24%205-33%2017%27%20stroke%3D%27%239eb779%27%20stroke-width%3D%277%27%20opacity%3D%27.12%27/%3E%0A%3Cpath%20d%3D%27M47%2066c-7%209-8%2017-3%2026%27%20stroke%3D%27%239eb779%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M162%2038c8%200%2015%205%2018%2013-8-1-15%201-21%207%27%20stroke%3D%27%239eb779%27%20stroke-width%3D%277%27%20opacity%3D%27.11%27/%3E%0A%3Ccircle%20cx%3D%27145%27%20cy%3D%27114%27%20r%3D%275%27%20fill%3D%27%23f1aa62%27%20opacity%3D%27.11%27/%3E%0A%3Ccircle%20cx%3D%27160%27%20cy%3D%27126%27%20r%3D%274%27%20fill%3D%27%23e8c560%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M82%20143h31%27%20stroke%3D%27%23d19a63%27%20stroke-width%3D%274%27%20opacity%3D%27.08%27/%3E%0A%3Cpath%20d%3D%27M90%20132h31%27%20stroke%3D%27%23d19a63%27%20stroke-width%3D%274%27%20opacity%3D%27.07%27/%3E%0A%3Cpath%20d%3D%27M95%2063l5%205%205-5%205%205%205-5%27%20stroke%3D%27%23f0ad6e%27%20stroke-width%3D%273.5%27%20opacity%3D%27.09%27/%3E%0A%3C/g%3E%0A%3C/svg%3E") !important;
      background-size: 220px 180px !important;
      background-repeat: repeat !important;
      background-attachment: fixed !important;
    }

    #boggle-shell {
      width: min(100%, 96rem) !important;
      margin: 0 auto !important;
      padding: 0.8rem 1rem 1.2rem !important;
      box-sizing: border-box !important;
    }

    #boggle-top {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      align-items: center !important;
      gap: 1rem !important;
      min-height: 4.15rem !important;
      margin: 0 0 0.95rem !important;
      padding: 0.5rem 0.9rem !important;
      border: 1px solid var(--mk-line) !important;
      border-radius: 1.4rem !important;
      background: var(--mk-panel) !important;
      box-shadow: var(--mk-shadow) !important;
      overflow: visible !important;
    }

    #boggle-top::after {
      display: none !important;
    }

    #boggle-brand {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
      min-width: 12.5rem !important;
      padding: 0.1rem 0.35rem 0.1rem 0.15rem !important;
      color: var(--mk-ink) !important;
      white-space: nowrap !important;
    }

    .boggle-brand-mark {
      font-size: clamp(2rem, 3vw, 3.1rem) !important;
      line-height: 0.95 !important;
      font-weight: 950 !important;
      letter-spacing: -0.05em !important;
      color: #7a3f18 !important;
      text-shadow: 0 2px 0 rgba(255, 246, 217, 0.95) !important;
    }

    .boggle-brand-dots {
      display: grid !important;
      grid-template-columns: repeat(2, 0.52rem) !important;
      gap: 0.18rem !important;
      transform: rotate(-8deg) !important;
    }

    .brand-dot {
      width: 0.52rem !important;
      height: 0.52rem !important;
      border-radius: 999px !important;
      display: block !important;
    }

    .brand-dot-orange { background: #f08a3c !important; }
    .brand-dot-yellow { background: #f4c951 !important; }
    .brand-dot-green { background: #94b96d !important; }

    #connection-controls {
      display: flex !important;
      align-items: center !important;
      gap: 0.75rem !important;
      flex-wrap: nowrap !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .connection-control {
      display: grid !important;
      grid-template-rows: auto auto !important;
      gap: 0.12rem !important;
      min-height: 0 !important;
      color: var(--mk-ink) !important;
    }

    .connection-field-label {
      font-size: 0.82rem !important;
      color: var(--mk-ink) !important;
      font-weight: 900 !important;
      padding-left: 0.18rem !important;
    }

    #room,
    #name {
      width: clamp(8rem, 13vw, 13rem) !important;
      min-height: 2.25rem !important;
      padding: 0 0.9rem !important;
      border-radius: var(--mk-pill) !important;
      border: 1px solid var(--mk-line) !important;
      background: #fffaf0 !important;
      color: var(--mk-ink) !important;
      box-shadow: none !important;
      font-weight: 850 !important;
    }

    #connection-actions {
      display: flex !important;
      align-items: center !important;
      gap: 0.75rem !important;
      margin-left: 0.1rem !important;
    }

    #connection-controls #player-preferences {
      margin-left: auto !important;
      z-index: 20 !important;
    }

    button:not(.board-cell),
    .ui-button,
    #connect,
    #start,
    #word-submit,
    #mode-options-toggle,
    #player-preferences > button,
    #end-game {
      border-radius: var(--mk-pill) !important;
      border: 1px solid transparent !important;
      background-image: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      font-weight: 950 !important;
      letter-spacing: 0 !important;
      transition: transform 120ms ease, filter 120ms ease, background 120ms ease !important;
    }

    button:not(.board-cell):hover,
    .ui-button:hover {
      transform: translateY(-1px) !important;
      filter: brightness(1.02) !important;
    }

    #connect,
    #start,
    #word-submit {
      background: var(--mk-orange) !important;
      color: #fffaf3 !important;
      border-color: rgba(185, 92, 36, 0.28) !important;
    }

    #connect {
      min-width: 7.6rem !important;
      min-height: 2.7rem !important;
      padding-inline: 1.2rem !important;
    }

    #start {
      width: 100% !important;
      min-height: 3.6rem !important;
      font-size: 1.08rem !important;
      justify-content: center !important;
    }

    #start::before {
      content: "⚂";
      margin-right: 0.55rem;
      font-size: 1.1rem;
    }

    #mode-options-toggle {
      min-height: 2.75rem !important;
      padding: 0 1.1rem !important;
      background: #fff6df !important;
      border-color: var(--mk-line) !important;
      color: var(--mk-ink) !important;
      justify-content: space-between !important;
      width: 100% !important;
    }

    #mode-options-toggle::before {
      content: "⚙";
      margin-right: 0.55rem;
      opacity: 0.82;
    }

    #player-preferences > button {
      min-height: 2.7rem !important;
      padding-inline: 1.2rem !important;
      background: #fff5e1 !important;
      color: var(--mk-ink) !important;
      border-color: var(--mk-line) !important;
    }

    #player-preferences > button::before {
      content: "⚙ ";
    }

    #status.connected-badge,
    #status {
      min-height: 2.4rem !important;
      padding: 0 1rem !important;
      background: var(--mk-green-soft) !important;
      color: #4d762c !important;
      border-color: rgba(101, 150, 58, 0.24) !important;
      border-radius: var(--mk-pill) !important;
    }

    #status.connected-badge::before {
      content: "●";
      margin-right: 0.45rem;
      color: #61a80f;
    }

    #boggle-layout {
      display: grid !important;
      grid-template-columns: minmax(16rem, 23rem) minmax(30rem, 46rem) minmax(16rem, 23rem) !important;
      gap: 0.95rem !important;
      align-items: start !important;
      justify-content: center !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.95rem !important;
      min-width: 0 !important;
    }

    #boggle-left {
      min-height: 0 !important;
    }


    #launch-panel {
      padding: 0.85rem !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0.65rem !important;
      background: #fff8e8 !important;
    }

    #launch-panel > h2 {
      display: none !important;
    }

    #mode-controls {
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    #mode-options-body {
      background: #fffaf0 !important;
      border: 1px solid var(--mk-line) !important;
      border-radius: 1rem !important;
      padding: 0.85rem !important;
      margin-top: 0.65rem !important;
    }

    #play-status-panel {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto auto !important;
      align-items: center !important;
      gap: 0.75rem !important;
      padding: 0.9rem 1rem !important;
      background: #fff8e8 !important;
    }

    #play-status-panel > h2 {
      display: block !important;
      grid-column: 1 / 2 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      font-size: 1.25rem !important;
      color: var(--mk-ink) !important;
    }

    #play-status-panel > h2::before {
      content: "🎮 ";
      font-size: 1rem;
    }

    #game-status {
      justify-self: start !important;
      min-height: 2.25rem !important;
      padding: 0 0.9rem !important;
      border-radius: var(--mk-pill) !important;
      background: #fffaf0 !important;
      color: var(--mk-ink) !important;
      border: 1px solid var(--mk-line) !important;
      font-weight: 950 !important;
    }

    #timer {
      justify-self: end !important;
      min-height: 2.9rem !important;
      padding: 0 1.25rem !important;
      background: var(--mk-yellow) !important;
      border: 1px solid rgba(168, 132, 43, 0.24) !important;
      border-radius: var(--mk-pill) !important;
      color: #5d351e !important;
      font-size: 1.28rem !important;
      font-weight: 950 !important;
    }

    #timer::before {
      content: "⏱";
      margin-right: 0.45rem;
    }

    #end-game {
      min-height: 2.9rem !important;
      padding: 0 1.25rem !important;
      background: var(--mk-red) !important;
      border-color: rgba(180, 63, 53, 0.24) !important;
      color: white !important;
    }

    #board {
      width: min(100%, 40rem) !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 0.95rem !important;
      gap: 0.65rem !important;
      border-radius: 1.55rem !important;
      background: #e7c47a !important;
      border: 1px solid rgba(143, 99, 49, 0.2) !important;
      box-shadow: 0 0.5rem 1rem rgba(103, 71, 38, 0.09) !important;
    }

    #board .board-cell {
      min-height: clamp(4.4rem, 8vw, 7rem) !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 1rem !important;
      border: 1px solid rgba(111, 73, 40, 0.12) !important;
      background: #fff7df !important;
      color: #5a321b !important;
      box-shadow: none !important;
    }

    #board .board-letter {
      font-size: clamp(1.9rem, 4.3vw, 3.6rem) !important;
      color: #5a321b !important;
      font-weight: 950 !important;
      line-height: 1 !important;
    }

    #board .board-cell::before {
      content: "";
      position: absolute;
      left: 0.7rem;
      top: 0.7rem;
      width: 0.32rem;
      height: 0.32rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.85);
      pointer-events: none;
    }

    #board .board-cell::after {
      content: "";
      position: absolute;
      right: 0.7rem;
      bottom: 0.7rem;
      width: 0.32rem;
      height: 0.32rem;
      border-radius: 999px;
      background: rgba(218, 178, 102, 0.25);
      pointer-events: none;
    }


    #word-form {
      width: min(100%, 46rem) !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
      padding: 0.85rem !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      gap: 0.8rem !important;
      align-items: center !important;
      border-radius: 1.45rem !important;
      background: var(--mk-panel) !important;
      border: 1px solid var(--mk-line) !important;
      box-shadow: var(--mk-shadow) !important;
    }

    #word-input {
      min-height: 3.45rem !important;
      border-radius: var(--mk-pill) !important;
      border: 1px solid var(--mk-line) !important;
      background: #fffaf0 !important;
      padding: 0 1.3rem !important;
      font-size: 1.18rem !important;
      color: var(--mk-ink) !important;
      box-shadow: none !important;
    }

    #word-submit {
      min-height: 3.45rem !important;
      min-width: 11rem !important;
      padding: 0 1.6rem !important;
      font-size: 1.08rem !important;
      border-radius: var(--mk-pill) !important;
    }

    #word-submit::before {
      content: "✓";
      margin-right: 0.55rem;
      font-size: 1.2rem;
    }

    #word-feedback {
      width: min(100%, 46rem) !important;
      margin: 0 auto !important;
      min-height: 2rem !important;
      text-align: center !important;
      color: var(--mk-ink) !important;
      font-weight: 850 !important;
    }

    #players-panel {
      min-height: 11rem !important;
    }

    #found-words-panel {
      min-height: 24rem !important;
      flex: 1 1 auto !important;
    }

    #players-panel > h2,
    #found-words-panel > h2,
    #help-panel > h2 {
      margin: 0 0 0.85rem !important;
      padding-bottom: 0.65rem !important;
      border-bottom: 1px solid var(--mk-line) !important;
      color: var(--mk-ink) !important;
      font-size: 1.2rem !important;
      font-weight: 950 !important;
    }

    #players-panel > h2::before { content: "👥 "; }
    #found-words-panel > h2::before { content: "📖 "; }
    #help-panel > h2::before { content: "💡 "; }

    #players {
      --player-row-height: 2.75rem !important;
      --player-row-gap: 0.38rem !important;
      height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3)) !important;
      max-height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3)) !important;
    }

    .players-scroll-list {
      gap: var(--player-row-gap) !important;
    }

    .player-row {
      height: var(--player-row-height) !important;
      border-radius: 0.95rem !important;
      padding: 0.35rem 0.55rem !important;
      background: #fff4d5 !important;
      border: 1px solid rgba(111, 73, 40, 0.08) !important;
    }

    .player-row:nth-child(2) {
      background: #fff8e8 !important;
    }

    .player-row:nth-child(3) {
      background: #fff8e8 !important;
    }

    .player-row:nth-child(4) {
      background: #fff8e8 !important;
    }

    .player-rank {
      width: 1.65rem !important;
      min-width: 1.65rem !important;
      height: 1.65rem !important;
      border-radius: 999px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: var(--mk-yellow) !important;
      border: 1px solid rgba(111, 73, 40, 0.12) !important;
      color: var(--mk-ink) !important;
      font-weight: 950 !important;
      opacity: 1 !important;
    }

    .player-score-line {
      font-size: 0.86rem !important;
      color: var(--mk-ink) !important;
      font-weight: 850 !important;
    }

    #found-words {
      display: block !important;
      font-size: 0.95rem !important;
      line-height: 1.7 !important;
      padding-right: 0.5rem !important;
      color: var(--mk-ink) !important;
    }

    .found-word-chip {
      display: inline-block !important;
      margin: 0 0.55rem 0.22rem 0 !important;
      color: var(--mk-ink) !important;
      font-weight: 850 !important;
    }

    #help-slot {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.95rem !important;
      max-height: none !important;
      overflow: visible !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    #help-panel {
      min-height: 18rem !important;
      background: var(--mk-panel) !important;
    }

    #help-panel > * {
      color: var(--mk-ink) !important;
    }

    #rules-summary {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.8rem !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    #rules-summary[hidden] {
      display: none !important;
    }

    #rules-summary .rule-pill {
      width: 100% !important;
      min-height: 5.7rem !important;
      justify-content: flex-start !important;
      align-items: flex-start !important;
      white-space: normal !important;
      text-align: left !important;
      box-sizing: border-box !important;
      padding: 1rem 1.1rem !important;
      border-radius: 1.25rem !important;
      font-size: 1rem !important;
      line-height: 1.35 !important;
      box-shadow: var(--mk-shadow) !important;
    }

    #rules-summary .rule-pill::before {
      margin-right: 0.65rem !important;
      font-size: 1.4rem !important;
      line-height: 1 !important;
    }

    .rule-pill-danger {
      background: var(--mk-green-soft) !important;
      border-color: rgba(96, 147, 64, 0.22) !important;
      color: #3f6c2a !important;
    }

    .rule-pill-danger::before {
      content: "✨";
    }

    .rule-pill-warning {
      background: var(--mk-red-soft) !important;
      border-color: rgba(224, 93, 81, 0.22) !important;
      color: #a94338 !important;
    }

    .rule-pill-warning::before {
      content: "!";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 999px;
      background: var(--mk-red);
      color: white;
      font-weight: 950;
    }

    #welcome-panel {
      background: var(--mk-panel) !important;
    }

    #player-preferences-body {
      background: var(--mk-panel) !important;
      border-radius: 1.2rem !important;
      border-color: var(--mk-line) !important;
    }

    @media (max-width: 78rem) {
      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #boggle-top {
        grid-template-columns: 1fr !important;
      }

      #boggle-brand {
        min-width: 0 !important;
      }

      #connection-controls {
        flex-wrap: wrap !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupCloserThemeV2() {
  if (document.querySelector("#boggle-mockup-closer-v2-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-closer-v2-style";
  style.textContent = `
    /* Passe v2 : on force une structure plus proche de la maquette. */

    #boggle-shell {
      width: min(100%, 99rem) !important;
      padding-top: 0.9rem !important;
    }

    #boggle-top {
      width: min(100%, 64rem) !important;
      margin-inline: auto !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      gap: 1rem !important;
      padding: 0.55rem 0.85rem !important;
      border-radius: 1.4rem !important;
    }

    #boggle-brand {
      min-width: 10rem !important;
      padding-right: 0.5rem !important;
    }

    .boggle-brand-mark {
      font-size: clamp(2.05rem, 3vw, 2.8rem) !important;
    }

    #connection-controls {
      display: grid !important;
      grid-template-columns: minmax(8rem, 12rem) minmax(8rem, 12rem) auto auto minmax(6rem, 1fr) auto !important;
      align-items: center !important;
      gap: 0.55rem !important;
    }

    #room-control,
    #name-control {
      min-width: 0 !important;
    }

    #room,
    #name {
      width: 100% !important;
      box-sizing: border-box !important;
    }

    #connection-actions {
      display: contents !important;
    }

    #connect {
      grid-column: 3 !important;
    }

    #status {
      grid-column: 4 !important;
    }

    #player-preferences {
      grid-column: 6 !important;
      justify-self: end !important;
      margin-left: 0 !important;
    }

    #boggle-layout {
      grid-template-columns: minmax(17rem, 21rem) minmax(32rem, 43rem) minmax(17rem, 21rem) !important;
      align-items: start !important;
      gap: 0.9rem !important;
    }

    #launch-panel {
      gap: 0.7rem !important;
      padding: 0.8rem !important;
    }

    #start,
    #mode-options-toggle,
    #connect,
    #status,
    #end-game,
    #word-submit,
    #player-preferences > button {
      border-radius: 9999px !important;
      background-image: none !important;
      box-shadow: none !important;
    }

    #start {
      min-height: 3.25rem !important;
      font-size: 1.08rem !important;
      background: #f07f32 !important;
      color: #fff8ed !important;
    }

    #mode-options-toggle {
      min-height: 2.75rem !important;
      background: #fff5dc !important;
      border: 1px solid rgba(111, 73, 40, 0.2) !important;
      color: #5d351e !important;
      justify-content: center !important;
      padding-inline: 1rem !important;
    }

    #mode-options-toggle::after {
      margin-left: auto !important;
    }

    #play-status-panel {
      display: grid !important;
      grid-template-columns: minmax(8rem, 1fr) auto auto auto !important;
      grid-template-rows: auto !important;
      gap: 0.75rem !important;
      align-items: center !important;
      min-height: 4.25rem !important;
      padding: 0.85rem 1rem !important;
      border-radius: 1.35rem !important;
    }

    #play-status-panel > h2 {
      display: block !important;
      grid-column: 1 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      font-size: 1.25rem !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
    }

    #game-status {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      min-height: 2.45rem !important;
      padding-inline: 1rem !important;
      border-radius: 9999px !important;
      background: #fff8ed !important;
      font-size: 0.94rem !important;
    }

    #timer {
      grid-column: 3 !important;
      grid-row: 1 !important;
      min-height: 2.65rem !important;
      padding-inline: 1rem !important;
      border-radius: 9999px !important;
      background: #f5d872 !important;
      white-space: nowrap !important;
    }

    #end-game {
      grid-column: 4 !important;
      grid-row: 1 !important;
      min-height: 2.7rem !important;
      min-width: 10rem !important;
      padding-inline: 1.25rem !important;
      background: #ef6255 !important;
      color: white !important;
      border-color: rgba(176, 58, 47, 0.25) !important;
      white-space: nowrap !important;
    }

    #board {
      width: min(100%, 38rem) !important;
      gap: 0.58rem !important;
      padding: 0.85rem !important;
    }

    #board .board-cell {
      min-height: clamp(4.5rem, 7vw, 6.45rem) !important;
      border-radius: 0.95rem !important;
    }

    #word-form {
      width: min(100%, 43rem) !important;
      grid-template-columns: minmax(0, 1fr) minmax(9.5rem, auto) !important;
      padding: 0.82rem 0.9rem !important;
      border-radius: 1.4rem !important;
      gap: 0.7rem !important;
    }

    #word-input {
      min-height: 3.4rem !important;
      font-size: 1.08rem !important;
      border-radius: 9999px !important;
    }

    #word-submit {
      min-height: 3.4rem !important;
      min-width: 10rem !important;
      border-radius: 9999px !important;
    }

    #boggle-right {
      min-height: 0 !important;
    }

    #help-slot {
      display: none !important;
    }

    #mockup-right-cards {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.85rem !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    .mockup-info-card {
      border: 1px solid rgba(111, 73, 40, 0.16) !important;
      border-radius: 1.3rem !important;
      background: #fff8e8 !important;
      color: #5d351e !important;
      padding: 1rem !important;
      box-shadow: 0 0.35rem 1rem rgba(97, 65, 35, 0.08) !important;
      box-sizing: border-box !important;
    }

    .mockup-info-card h2 {
      display: grid !important;
      grid-template-columns: auto 1fr auto !important;
      align-items: center !important;
      gap: 0.65rem !important;
      margin: 0 0 0.75rem !important;
      padding-bottom: 0.65rem !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.14) !important;
      font-size: 1.25rem !important;
      line-height: 1.1 !important;
      color: #5d351e !important;
      font-weight: 950 !important;
    }

    .mockup-info-card p {
      margin: 0 !important;
      color: #6e5038 !important;
      font-weight: 650 !important;
      line-height: 1.38 !important;
    }

    .mockup-info-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 2.15rem !important;
      height: 2.15rem !important;
      border-radius: 9999px !important;
      background: #ffeeb5 !important;
      font-size: 1.25rem !important;
    }

    .mockup-info-question {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 1.55rem !important;
      height: 1.55rem !important;
      border-radius: 9999px !important;
      background: rgba(111, 73, 40, 0.22) !important;
      color: #fffaf0 !important;
      font-size: 0.9rem !important;
      font-weight: 950 !important;
    }

    .mockup-help-list {
      display: grid !important;
      gap: 0.7rem !important;
      margin: 0.85rem 0 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }

    .mockup-help-list li {
      display: grid !important;
      grid-template-columns: 2.2rem 1fr !important;
      gap: 0.7rem !important;
      align-items: center !important;
      color: #6e5038 !important;
      line-height: 1.3 !important;
      font-weight: 650 !important;
    }

    .mockup-help-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 2.1rem !important;
      height: 2.1rem !important;
      border-radius: 0.7rem !important;
      background: #fff0bb !important;
      color: #d97824 !important;
      font-weight: 950 !important;
    }

    .unique-card {
      background: #e7f4d6 !important;
      border-color: rgba(100, 153, 68, 0.22) !important;
    }

    .unique-card .mockup-info-icon {
      background: #cfe7b7 !important;
      color: #4f7b30 !important;
    }

    .unique-card h2,
    .unique-card p {
      color: #3f6c2a !important;
    }

    .penalty-card {
      background: #ffe0d8 !important;
      border-color: rgba(224, 93, 81, 0.22) !important;
    }

    .penalty-card .mockup-info-icon {
      background: #ef6255 !important;
      color: white !important;
      font-weight: 950 !important;
    }

    .penalty-card h2,
    .penalty-card p {
      color: #a94338 !important;
    }

    #players-panel,
    #found-words-panel {
      min-height: auto !important;
    }

    #players-panel {
      height: 13.4rem !important;
    }

    #found-words-panel {
      height: 24rem !important;
    }

    #players-panel > h2,
    #found-words-panel > h2 {
      font-size: 1.08rem !important;
      padding-bottom: 0.65rem !important;
      margin-bottom: 0.75rem !important;
    }

    #players {
      --player-row-height: 2.45rem !important;
      --player-row-gap: 0.32rem !important;
    }

    .player-row {
      border-radius: 0.85rem !important;
    }

    .player-rank {
      border-radius: 9999px !important;
    }

    @media (max-width: 78rem) {
      #connection-controls {
        display: flex !important;
        flex-wrap: wrap !important;
      }

      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #mockup-right-cards {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)) !important;
      }

      #play-status-panel {
        grid-template-columns: 1fr auto !important;
      }

      #game-status,
      #timer,
      #end-game {
        grid-column: auto !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupCloserThemeV3() {
  if (document.querySelector("#boggle-mockup-closer-v3-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-closer-v3-style";
  style.textContent = `
    /* V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau. */

    :root {
      --mk-cute-font: "Comic Sans MS", "Trebuchet MS", "Arial Rounded MT Bold", "Avenir Next Rounded", "Segoe UI", system-ui, sans-serif;
    }

    html,
    body,
    button,
    input,
    select,
    textarea {
      font-family: var(--mk-cute-font) !important;
    }

    body {
      font-weight: 650 !important;
    }

    #boggle-shell {
      width: min(100%, 100rem) !important;
      padding: 0.85rem 1.1rem 1.3rem !important;
    }

    #boggle-top {
      width: min(100%, 72rem) !important;
      margin: 0 auto 0.95rem !important;
      padding: 0.25rem 0.35rem !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      border-radius: 0 !important;
      min-height: 4.3rem !important;
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      align-items: center !important;
      gap: 1.15rem !important;
    }

    #boggle-brand {
      min-width: 10.8rem !important;
      padding: 0 !important;
      filter: drop-shadow(0 0.08rem 0 rgba(255, 245, 220, 0.95));
    }

    .boggle-brand-mark {
      font-family: var(--mk-cute-font) !important;
      font-size: clamp(2.35rem, 3.25vw, 3.35rem) !important;
      line-height: 0.9 !important;
      font-weight: 950 !important;
      color: #7b3f16 !important;
      letter-spacing: -0.06em !important;
    }

    .boggle-brand-dots {
      margin-left: 0.1rem !important;
    }

    #connection-controls {
      display: grid !important;
      grid-template-columns: minmax(9rem, 13rem) minmax(9rem, 13rem) auto auto 1fr auto !important;
      gap: 0.7rem !important;
      align-items: center !important;
      width: 100% !important;
    }

    .connection-field-label {
      font-size: 0.92rem !important;
      font-weight: 950 !important;
      color: #6b3b1f !important;
      padding-left: 0.25rem !important;
      margin-bottom: 0.08rem !important;
    }

    #room,
    #name {
      min-height: 2.55rem !important;
      border-radius: 9999px !important;
      background: rgba(255, 249, 235, 0.9) !important;
      border: 1px solid rgba(123, 83, 47, 0.2) !important;
      box-shadow: none !important;
      font-size: 1rem !important;
      padding: 0 1rem !important;
    }

    #connect,
    #status,
    #player-preferences > button {
      min-height: 2.75rem !important;
      border-radius: 9999px !important;
      padding-inline: 1.25rem !important;
      font-size: 1rem !important;
      box-shadow: none !important;
    }

    #player-preferences > button {
      background: rgba(255, 246, 225, 0.76) !important;
      border: 1px solid rgba(123, 83, 47, 0.22) !important;
    }

    #boggle-layout {
      grid-template-columns: minmax(17rem, 22rem) minmax(34rem, 43rem) minmax(18rem, 22rem) !important;
      gap: 0.9rem !important;
    }

    #play-status-panel {
      grid-template-columns: minmax(8rem, 1fr) auto auto auto !important;
      background: #fff8e8 !important;
      border-radius: 1.35rem !important;
      align-items: center !important;
    }

    #play-status-panel > h2 {
      font-size: 1.36rem !important;
      color: #5d351e !important;
      letter-spacing: -0.02em !important;
    }

    #game-status {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      min-height: auto !important;
      color: #7c6048 !important;
      font-size: 1rem !important;
      font-weight: 850 !important;
      border-radius: 0 !important;
      justify-self: start !important;
    }

    #game-status::before {
      content: "•";
      margin-right: 0.35rem;
      color: #f07f32;
      font-weight: 950;
    }

    #timer {
      min-height: 2.8rem !important;
      padding-inline: 1.05rem !important;
      border-radius: 9999px !important;
      box-shadow: none !important;
    }

    #end-game {
      min-height: 2.85rem !important;
      min-width: 11rem !important;
      border-radius: 9999px !important;
      box-shadow: none !important;
    }

    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #play-status-panel,
    #launch-panel,
    #word-form {
      box-shadow: 0 0.3rem 0.85rem rgba(97, 65, 35, 0.07) !important;
    }

    #found-words {
      display: block !important;
      overflow-y: auto !important;
      padding-right: 0.45rem !important;
    }

    .found-words-table {
      display: grid !important;
      grid-template-columns: minmax(5.5rem, 1fr) 4.7rem minmax(4.6rem, 0.85fr) !important;
      align-items: center !important;
      width: 100% !important;
      row-gap: 0 !important;
      column-gap: 0 !important;
      font-size: 0.98rem !important;
      color: #5d351e !important;
    }

    .found-words-header-cell {
      padding: 0.38rem 0.5rem !important;
      background: rgba(255, 242, 210, 0.95) !important;
      color: #7a5b40 !important;
      font-weight: 900 !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.12) !important;
    }

    .found-words-header-cell:first-child {
      border-top-left-radius: 0.8rem !important;
      border-bottom-left-radius: 0.8rem !important;
    }

    .found-words-header-cell:nth-child(3) {
      border-top-right-radius: 0.8rem !important;
      border-bottom-right-radius: 0.8rem !important;
    }

    .found-words-word,
    .found-words-points,
    .found-words-player {
      min-height: 2rem !important;
      display: inline-flex !important;
      align-items: center !important;
      padding: 0.28rem 0.5rem !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.07) !important;
      box-sizing: border-box !important;
    }

    .found-words-word {
      gap: 0.42rem !important;
      font-weight: 950 !important;
    }

    .found-words-points,
    .found-words-player {
      color: #7a5b40 !important;
      font-weight: 750 !important;
    }

    .found-word-dot {
      width: 0.72rem !important;
      height: 0.72rem !important;
      border-radius: 9999px !important;
      flex: 0 0 auto !important;
      box-shadow: inset 0 0 0 1px rgba(111, 73, 40, 0.08) !important;
    }

    .found-word-dot-0 { background: #f7b21b !important; }
    .found-word-dot-1 { background: #ef6255 !important; }
    .found-word-dot-2 { background: #62b64b !important; }
    .found-word-dot-3 { background: #8f4dd7 !important; }
    .found-word-dot-4 { background: #f08a31 !important; }
    .found-word-dot-5 { background: #49a6d8 !important; }

    .found-words-empty-row {
      grid-column: 1 / -1 !important;
      padding: 0.75rem 0.5rem !important;
      color: #7a5b40 !important;
      font-weight: 750 !important;
      font-style: italic !important;
    }

    #mockup-right-cards .mockup-info-card h2 {
      font-size: 1.28rem !important;
      letter-spacing: -0.02em !important;
    }

    #mockup-right-cards .mockup-info-card p,
    .mockup-help-list li {
      font-size: 0.96rem !important;
    }

    #word-form {
      border-radius: 1.6rem !important;
    }

    #word-input {
      min-height: 3.55rem !important;
      border-radius: 9999px !important;
    }

    #word-submit {
      min-height: 3.55rem !important;
      border-radius: 9999px !important;
    }

    @media (max-width: 78rem) {
      #boggle-top {
        width: 100% !important;
        grid-template-columns: 1fr !important;
      }

      #connection-controls {
        display: flex !important;
        flex-wrap: wrap !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupCloserThemeV4() {
  if (document.querySelector("#boggle-mockup-closer-v4-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-closer-v4-style";
  style.textContent = `
    /*
     * V4 : rapprochement plus fort de la maquette.
     * Police plus ronde, top bar posée sur le fond, panneaux plus larges et tableau des mots plus propre.
     */
    @import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap");

    :root {
      --cute-font: "Fredoka", "Nunito", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif;
      --cute-logo-font: "Fredoka", "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif;
      --cream: #fbf1da;
      --cream-strong: #fff8e8;
      --cream-soft: #fff3cf;
      --brown: #6e3d1d;
      --brown-dark: #4f2a17;
      --brown-muted: #8a6447;
      --orange: #f47f2f;
      --orange-dark: #e37027;
      --yellow: #f6d86b;
      --yellow-soft: #fff0b7;
      --green: #80b84f;
      --green-soft: #e3f1cc;
      --red: #ef6358;
      --red-soft: #ffe0d9;
      --line-soft: rgba(111, 73, 40, 0.16);
      --panel-radius: 1.55rem;
      --button-radius: 9999px;
      --soft-shadow: 0 0.45rem 1rem rgba(104, 73, 40, 0.075);
    }

    html,
    body,
    button,
    input,
    select,
    textarea {
      font-family: var(--cute-font) !important;
    }

    body {
      color: var(--brown-dark) !important;
      font-size: 16px !important;
      letter-spacing: 0.002em !important;
    }

    #boggle-shell {
      width: min(100%, 104rem) !important;
      padding: 0.7rem 1.2rem 1.4rem !important;
    }

    /*
     * Top sans carte : on pose les éléments sur le fond.
     */
    #boggle-top {
      width: min(100%, 82rem) !important;
      margin: 0 auto 1.05rem !important;
      padding: 0.25rem 0.15rem !important;
      min-height: 5rem !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      align-items: center !important;
      column-gap: 1.6rem !important;
    }

    #boggle-brand {
      min-width: 13rem !important;
      padding: 0 !important;
      transform: translateY(-0.05rem) rotate(-1.5deg) !important;
    }

    .boggle-brand-mark {
      font-family: var(--cute-logo-font) !important;
      font-size: clamp(2.8rem, 4.6vw, 4.4rem) !important;
      font-weight: 700 !important;
      line-height: 0.9 !important;
      letter-spacing: -0.075em !important;
      color: #7c3f15 !important;
      text-shadow:
        0 0.13rem 0 #fff0c4,
        0.06rem 0.06rem 0 rgba(79, 42, 23, 0.1) !important;
    }

    .boggle-brand-dots {
      grid-template-columns: repeat(2, 0.62rem) !important;
      gap: 0.22rem !important;
      margin-left: 0.15rem !important;
      transform: rotate(-12deg) translateY(-0.45rem) !important;
    }

    .brand-dot {
      width: 0.62rem !important;
      height: 0.62rem !important;
    }

    #connection-controls {
      display: grid !important;
      grid-template-columns: minmax(10rem, 14rem) minmax(10rem, 14rem) auto auto 1fr auto !important;
      gap: 0.85rem !important;
      align-items: center !important;
    }

    .connection-control {
      gap: 0.18rem !important;
    }

    .connection-field-label {
      font-size: 1.02rem !important;
      font-weight: 700 !important;
      color: var(--brown) !important;
      padding-left: 0.75rem !important;
      line-height: 1 !important;
    }

    #room,
    #name {
      height: 2.75rem !important;
      border-radius: var(--button-radius) !important;
      background: rgba(255, 248, 232, 0.92) !important;
      border: 2px solid rgba(111, 73, 40, 0.14) !important;
      box-shadow: inset 0 0.08rem 0 rgba(255, 255, 255, 0.9) !important;
      padding: 0 1.05rem !important;
      color: var(--brown-dark) !important;
      font-size: 1.04rem !important;
      font-weight: 600 !important;
    }

    #connect {
      height: 3rem !important;
      min-height: 3rem !important;
      padding-inline: 1.65rem !important;
      background: var(--orange) !important;
      border: 2px solid rgba(182, 88, 34, 0.16) !important;
      color: white !important;
      font-size: 1.06rem !important;
      font-weight: 700 !important;
    }

    #status {
      height: 2.8rem !important;
      min-height: 2.8rem !important;
      padding-inline: 1.2rem !important;
      background: var(--green-soft) !important;
      border: 2px solid rgba(103, 157, 70, 0.15) !important;
      color: #4f7b2e !important;
      font-weight: 700 !important;
      font-size: 1rem !important;
    }

    #player-preferences > button {
      height: 3rem !important;
      min-height: 3rem !important;
      padding: 0 1.45rem !important;
      background: rgba(255, 247, 227, 0.72) !important;
      border: 2px solid rgba(111, 73, 40, 0.18) !important;
      color: var(--brown) !important;
      font-size: 1.06rem !important;
      font-weight: 700 !important;
    }

    #boggle-layout {
      grid-template-columns: minmax(18.5rem, 24.5rem) minmax(37rem, 49rem) minmax(19rem, 24.5rem) !important;
      gap: 1.05rem !important;
      justify-content: center !important;
    }

    .boggle-column > section,
    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #launch-panel,
    #play-status-panel,
    #word-form,
    #welcome-panel {
      border-radius: var(--panel-radius) !important;
      background: rgba(255, 248, 232, 0.94) !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      box-shadow: var(--soft-shadow) !important;
    }

    #launch-panel {
      padding: 0.95rem !important;
      gap: 0.72rem !important;
    }

    #start {
      height: 3.75rem !important;
      min-height: 3.75rem !important;
      border-radius: var(--button-radius) !important;
      font-size: 1.22rem !important;
      font-weight: 700 !important;
      background: var(--orange) !important;
      border: 0 !important;
      color: #fff9ef !important;
    }

    #mode-options-toggle {
      height: 3.1rem !important;
      min-height: 3.1rem !important;
      border-radius: var(--button-radius) !important;
      background: rgba(255, 247, 226, 0.92) !important;
      border: 2px solid rgba(111, 73, 40, 0.13) !important;
      color: var(--brown) !important;
      font-size: 1.05rem !important;
      font-weight: 700 !important;
    }

    /*
     * Barre Partie plus proche de la capture : titre + sous-texte intégré,
     * aucun badge visible autour de “Partie en cours”.
     */
    #play-status-panel {
      grid-template-columns: minmax(13rem, 1fr) auto auto !important;
      gap: 1rem !important;
      min-height: 5.3rem !important;
      padding: 1rem 1.15rem !important;
      align-items: center !important;
      background: rgba(255, 248, 232, 0.96) !important;
    }

    #play-status-panel > h2 {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      grid-template-rows: auto auto !important;
      column-gap: 0.7rem !important;
      align-items: center !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      color: var(--brown-dark) !important;
      font-size: 1.58rem !important;
      font-weight: 700 !important;
      letter-spacing: -0.035em !important;
      line-height: 1 !important;
    }

    #play-status-panel > h2::before {
      content: "🎮" !important;
      grid-row: 1 / span 2 !important;
      font-size: 1.55rem !important;
      transform: translateY(0.08rem) !important;
    }

    #play-status-panel > h2::after {
      content: "Trouvez un maximum de mots !" !important;
      grid-column: 2 !important;
      grid-row: 2 !important;
      color: var(--brown-muted) !important;
      font-size: 1.02rem !important;
      font-weight: 500 !important;
      letter-spacing: 0 !important;
      margin-top: 0.18rem !important;
    }

    #game-status {
      grid-column: 1 !important;
      grid-row: 1 !important;
      align-self: end !important;
      justify-self: start !important;
      transform: translate(2.65rem, 1.25rem) !important;
      display: inline-flex !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      color: var(--brown-muted) !important;
      font-size: 0.98rem !important;
      font-weight: 600 !important;
      line-height: 1 !important;
    }

    #game-status::before {
      content: "" !important;
      margin: 0 !important;
    }

    #timer {
      grid-column: 2 !important;
      min-height: 3.05rem !important;
      height: 3.05rem !important;
      padding: 0 1.22rem !important;
      border-radius: var(--button-radius) !important;
      background: var(--yellow) !important;
      color: var(--brown-dark) !important;
      border: 2px solid rgba(158, 118, 37, 0.12) !important;
      font-size: 1.32rem !important;
      font-weight: 700 !important;
    }

    #end-game {
      grid-column: 3 !important;
      height: 3.1rem !important;
      min-height: 3.1rem !important;
      min-width: 12rem !important;
      border-radius: var(--button-radius) !important;
      background: var(--red) !important;
      color: white !important;
      border: 0 !important;
      font-size: 1.05rem !important;
      font-weight: 700 !important;
    }

    #board {
      width: min(100%, 43rem) !important;
      padding: 1.05rem !important;
      gap: 0.72rem !important;
      border-radius: 1.75rem !important;
      background: #e8c36f !important;
      border: 2px solid rgba(139, 92, 38, 0.11) !important;
    }

    #board .board-cell {
      min-height: clamp(5rem, 7.1vw, 7.2rem) !important;
      border-radius: 1.18rem !important;
      background: #fff6df !important;
      border: 2px solid rgba(111, 73, 40, 0.08) !important;
    }

    #board .board-letter {
      font-family: var(--cute-font) !important;
      font-size: clamp(2.15rem, 4.3vw, 3.85rem) !important;
      font-weight: 700 !important;
      color: #5c2f17 !important;
      letter-spacing: -0.03em !important;
    }

    #word-form {
      width: min(100%, 43.5rem) !important;
      min-height: 5.35rem !important;
      padding: 0.92rem 1rem !important;
      grid-template-columns: minmax(0, 1fr) minmax(10.5rem, auto) !important;
      gap: 0.85rem !important;
      border-radius: 1.7rem !important;
    }

    #word-input {
      height: 3.75rem !important;
      min-height: 3.75rem !important;
      border-radius: var(--button-radius) !important;
      padding-inline: 1.35rem !important;
      font-size: 1.17rem !important;
      font-weight: 500 !important;
    }

    #word-submit {
      height: 3.75rem !important;
      min-height: 3.75rem !important;
      min-width: 11.5rem !important;
      border-radius: var(--button-radius) !important;
      background: var(--orange) !important;
      border: 0 !important;
      font-size: 1.16rem !important;
      font-weight: 700 !important;
    }

    #players-panel,
    #found-words-panel {
      padding: 1rem !important;
    }

    #players-panel > h2,
    #found-words-panel > h2,
    .mockup-info-card h2 {
      font-size: 1.42rem !important;
      font-weight: 700 !important;
      letter-spacing: -0.035em !important;
      color: var(--brown-dark) !important;
    }

    #players-panel {
      height: 15.4rem !important;
    }

    #found-words-panel {
      height: 29rem !important;
    }

    .found-words-table {
      grid-template-columns: minmax(6.5rem, 1fr) 5.2rem minmax(5.6rem, 0.9fr) !important;
      font-size: 1.02rem !important;
      border-radius: 1rem !important;
      overflow: hidden !important;
    }

    .found-words-header-cell {
      background: rgba(255, 232, 163, 0.72) !important;
      font-size: 1.02rem !important;
      padding: 0.52rem 0.6rem !important;
      color: var(--brown) !important;
      font-weight: 700 !important;
    }

    .found-words-word,
    .found-words-points,
    .found-words-player {
      min-height: 2.35rem !important;
      padding: 0.36rem 0.6rem !important;
      background: rgba(255, 250, 239, 0.54) !important;
    }

    .found-words-word strong {
      font-weight: 700 !important;
      color: var(--brown-dark) !important;
    }

    .found-words-empty-row {
      background: rgba(255, 250, 239, 0.54) !important;
      padding: 0.9rem 0.7rem !important;
      font-weight: 500 !important;
      line-height: 1.45 !important;
    }

    #mockup-right-cards {
      gap: 1rem !important;
    }

    .mockup-info-card {
      padding: 1.08rem !important;
      border-radius: 1.55rem !important;
    }

    .mockup-info-card h2 {
      margin-bottom: 0.85rem !important;
      padding-bottom: 0.75rem !important;
    }

    .mockup-info-card p,
    .mockup-help-list li {
      font-size: 1.02rem !important;
      line-height: 1.4 !important;
      font-weight: 500 !important;
    }

    .mockup-info-icon {
      width: 2.35rem !important;
      height: 2.35rem !important;
      font-size: 1.32rem !important;
    }

    .mockup-help-list {
      gap: 0.78rem !important;
    }

    .mockup-help-icon {
      width: 2.25rem !important;
      height: 2.25rem !important;
    }

    @media (max-width: 86rem) {
      #boggle-layout {
        grid-template-columns: minmax(16rem, 21rem) minmax(32rem, 42rem) minmax(16rem, 21rem) !important;
      }

      #boggle-top {
        width: min(100%, 74rem) !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-top {
        grid-template-columns: 1fr !important;
      }

      #connection-controls {
        display: flex !important;
        flex-wrap: wrap !important;
      }

      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #game-status {
        transform: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupFullWidthThemeV5() {
  if (document.querySelector("#boggle-mockup-full-width-v5-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-full-width-v5-style";
  style.textContent = `
    /*
     * V5 : pleine largeur + centre plus unifié.
     * But : moins de cartes empilées, plus proche de la maquette générée.
     */

    body {
      overflow-x: hidden !important;
    }

    #boggle-shell {
      width: calc(100vw - 2rem) !important;
      max-width: 108rem !important;
      margin: 0 auto !important;
      padding: 0.8rem 0 1.4rem !important;
      box-sizing: border-box !important;
    }

    #boggle-top {
      width: 100% !important;
      max-width: none !important;
      margin: 0 auto 1rem !important;
      padding: 0.15rem 0.65rem !important;
      box-sizing: border-box !important;
    }

    #connection-controls {
      grid-template-columns:
        minmax(10rem, 14rem)
        minmax(10rem, 14rem)
        auto
        auto
        minmax(1rem, 1fr)
        auto !important;
    }

    #boggle-layout {
      width: 100% !important;
      max-width: none !important;
      display: grid !important;
      grid-template-columns:
        minmax(18rem, 0.92fr)
        minmax(38rem, 1.62fr)
        minmax(18rem, 0.92fr) !important;
      gap: clamp(0.9rem, 1.4vw, 1.35rem) !important;
      align-items: start !important;
      justify-content: stretch !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      width: 100% !important;
      min-width: 0 !important;
    }

    /*
     * On transforme le centre en grande zone de jeu continue.
     * Le plateau, la barre partie et la saisie semblent faire partie d’un même espace.
     */
    #boggle-center {
      position: relative !important;
      gap: 0 !important;
      padding: 0.95rem !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      border-radius: 1.9rem !important;
      background:
        linear-gradient(180deg, rgba(255, 249, 232, 0.96), rgba(255, 244, 213, 0.92)) !important;
      box-shadow: 0 0.45rem 1rem rgba(104, 73, 40, 0.075) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    #boggle-center::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      background:
        radial-gradient(circle at 8% 20%, rgba(244, 127, 47, 0.08) 0 0.35rem, transparent 0.38rem),
        radial-gradient(circle at 91% 26%, rgba(128, 184, 79, 0.10) 0 0.45rem, transparent 0.48rem),
        radial-gradient(circle at 12% 74%, rgba(128, 184, 79, 0.08) 0 0.5rem, transparent 0.53rem),
        radial-gradient(circle at 88% 82%, rgba(244, 127, 47, 0.08) 0 0.34rem, transparent 0.37rem) !important;
      pointer-events: none !important;
    }

    #boggle-center > * {
      position: relative !important;
      z-index: 1 !important;
    }

    /*
     * Le bloc lancement reste en haut, mais avec moins d'effet carte.
     */
    #launch-panel {
      margin: 0 0 0.85rem !important;
      padding: 0.15rem 0 0.75rem !important;
      border: 0 !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.10) !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    #start {
      width: min(100%, 42rem) !important;
      margin: 0 auto !important;
      height: 3.55rem !important;
      min-height: 3.55rem !important;
    }

    #mode-controls {
      width: min(100%, 42rem) !important;
      margin: 0.7rem auto 0 !important;
    }

    /*
     * Barre Partie intégrée, sans carte/sous-zone nette.
     */
    #play-status-panel {
      grid-template-columns: minmax(15rem, 1fr) auto auto !important;
      gap: 1rem !important;
      margin: 0.15rem 0 0.8rem !important;
      padding: 0.3rem 0.1rem 0.55rem !important;
      min-height: 3.9rem !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      align-items: center !important;
    }

    #play-status-panel > h2 {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.65rem !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      font-size: 1.65rem !important;
      line-height: 1 !important;
    }

    #play-status-panel > h2::before {
      content: "🎮" !important;
      font-size: 1.45rem !important;
      transform: none !important;
    }

    #play-status-panel > h2::after {
      display: none !important;
      content: none !important;
    }

    #game-status {
      position: static !important;
      transform: none !important;
      grid-column: 1 !important;
      grid-row: auto !important;
      align-self: center !important;
      justify-self: start !important;
      margin-left: 3.1rem !important;
      margin-top: -0.35rem !important;
      display: block !important;
      background: transparent !important;
      border: 0 !important;
      padding: 0 !important;
      color: #8a6447 !important;
      font-size: 1.02rem !important;
      font-weight: 600 !important;
      box-shadow: none !important;
    }

    #game-status::before {
      content: "" !important;
    }

    #timer {
      grid-column: 2 !important;
      height: 3rem !important;
      min-height: 3rem !important;
      padding: 0 1.25rem !important;
      font-size: 1.28rem !important;
    }

    #end-game {
      grid-column: 3 !important;
      height: 3rem !important;
      min-height: 3rem !important;
      min-width: 12.5rem !important;
      padding: 0 1.35rem !important;
    }

    /*
     * Plateau agrandi pour occuper la largeur centrale.
     */
    #board {
      width: min(100%, 46rem) !important;
      max-width: none !important;
      margin: 0 auto !important;
      padding: clamp(0.9rem, 1vw, 1.15rem) !important;
      gap: clamp(0.55rem, 0.75vw, 0.82rem) !important;
      border-radius: 1.8rem !important;
      background: #e8c36f !important;
      box-sizing: border-box !important;
    }

    #board .board-cell {
      min-height: clamp(4.9rem, 6.9vw, 7.35rem) !important;
      border-radius: 1.15rem !important;
    }

    #word-form {
      width: min(100%, 46rem) !important;
      margin: 0.9rem auto 0 !important;
      min-height: 5.2rem !important;
      padding: 0.75rem 0.85rem !important;
      border: 0 !important;
      border-top: 1px solid rgba(111, 73, 40, 0.10) !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      grid-template-columns: minmax(0, 1fr) minmax(10.8rem, auto) !important;
    }

    #word-input {
      background: rgba(255, 250, 239, 0.92) !important;
      border: 2px solid rgba(111, 73, 40, 0.12) !important;
      height: 3.65rem !important;
    }

    #word-submit {
      height: 3.65rem !important;
      min-width: 11rem !important;
    }

    #word-feedback {
      width: min(100%, 46rem) !important;
      margin: 0.35rem auto 0 !important;
    }

    /*
     * Colonnes latérales plus hautes, pour mieux remplir l’écran.
     */
    #players-panel {
      height: clamp(13.5rem, 20vh, 17rem) !important;
    }

    #found-words-panel {
      height: clamp(27rem, 48vh, 36rem) !important;
    }

    #mockup-right-cards {
      gap: clamp(0.9rem, 1.2vw, 1.25rem) !important;
    }

    .mockup-info-card {
      padding: clamp(1rem, 1.1vw, 1.25rem) !important;
      border-radius: 1.6rem !important;
    }

    #mockup-help-card {
      min-height: clamp(18rem, 29vh, 24rem) !important;
    }

    #mockup-unique-card,
    #mockup-penalty-card {
      min-height: clamp(8.5rem, 14vh, 12rem) !important;
    }

    .mockup-info-card h2 {
      font-size: clamp(1.25rem, 1.35vw, 1.55rem) !important;
    }

    .mockup-info-card p,
    .mockup-help-list li {
      font-size: clamp(0.95rem, 1vw, 1.08rem) !important;
    }

    /*
     * Quand la largeur le permet, on se rapproche encore plus de la capture générée :
     * plus d’espace pour gauche/droite et un centre dominant.
     */
    @media (min-width: 100rem) {
      #boggle-layout {
        grid-template-columns:
          minmax(22rem, 0.95fr)
          minmax(44rem, 1.55fr)
          minmax(22rem, 0.95fr) !important;
      }

      #board {
        width: min(100%, 48rem) !important;
      }

      #word-form {
        width: min(100%, 48rem) !important;
      }
    }

    @media (max-width: 86rem) {
      #boggle-shell {
        width: calc(100vw - 1rem) !important;
      }

      #boggle-layout {
        grid-template-columns:
          minmax(16rem, 21rem)
          minmax(32rem, 43rem)
          minmax(16rem, 21rem) !important;
      }

      #boggle-center {
        padding: 0.8rem !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #boggle-center {
        max-width: 48rem !important;
        margin: 0 auto !important;
      }

      #play-status-panel {
        grid-template-columns: 1fr auto !important;
      }

      #end-game {
        grid-column: 1 / -1 !important;
        justify-self: start !important;
      }

      #game-status {
        margin-left: 0 !important;
        margin-top: 0.25rem !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupFullWidthThemeV6() {
  if (document.querySelector("#boggle-mockup-full-width-v6-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-full-width-v6-style";
  style.textContent = `
    /*
     * V6 : corrige le décalage pleine largeur.
     * On neutralise les contraintes du parent et on force un layout viewport centré.
     */

    body {
      overflow-x: hidden !important;
    }

    main,
    #app,
    body > main,
    body > #app {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    #boggle-shell {
      width: 100vw !important;
      max-width: none !important;
      margin-left: 50% !important;
      margin-right: 0 !important;
      transform: translateX(-50%) !important;
      padding: 0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important;
      box-sizing: border-box !important;
    }

    #boggle-top {
      width: 100% !important;
      max-width: 104rem !important;
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: clamp(0.2rem, 0.8vw, 0.8rem) !important;
      padding-right: clamp(0.2rem, 0.8vw, 0.8rem) !important;
      box-sizing: border-box !important;
    }

    #boggle-layout {
      width: 100% !important;
      max-width: 104rem !important;
      margin-left: auto !important;
      margin-right: auto !important;
      display: grid !important;
      grid-template-columns:
        minmax(18rem, 1fr)
        minmax(38rem, 1.7fr)
        minmax(18rem, 1fr) !important;
      gap: clamp(0.85rem, 1.2vw, 1.15rem) !important;
      justify-content: stretch !important;
      align-items: start !important;
      box-sizing: border-box !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      min-width: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    #boggle-left > *,
    #boggle-right > *,
    #boggle-center > * {
      max-width: none !important;
    }

    /*
     * Statut placé à droite du titre quand l'écran est large.
     */
    #play-status-panel {
      grid-template-columns: auto minmax(7rem, 1fr) auto auto !important;
      column-gap: 0.95rem !important;
      row-gap: 0.15rem !important;
      align-items: center !important;
    }

    #play-status-panel > h2 {
      grid-column: 1 !important;
      grid-row: 1 !important;
      white-space: nowrap !important;
    }

    #game-status {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      align-self: center !important;
      margin: 0 !important;
      transform: none !important;
      font-size: 1.02rem !important;
      line-height: 1 !important;
      color: #8a6447 !important;
      white-space: nowrap !important;
    }

    #game-status::before {
      content: "•" !important;
      margin-right: 0.38rem !important;
      color: #f47f2f !important;
      font-weight: 900 !important;
    }

    #timer {
      grid-column: 3 !important;
      grid-row: 1 !important;
      justify-self: end !important;
    }

    #end-game {
      grid-column: 4 !important;
      grid-row: 1 !important;
      justify-self: end !important;
    }

    #board {
      width: min(100%, 49rem) !important;
    }

    #word-form,
    #word-feedback {
      width: min(100%, 49rem) !important;
    }

    #players-panel {
      height: clamp(14rem, 22vh, 18rem) !important;
    }

    #found-words-panel {
      height: clamp(29rem, 52vh, 39rem) !important;
    }

    #mockup-help-card {
      min-height: clamp(19rem, 31vh, 25rem) !important;
    }

    #mockup-unique-card,
    #mockup-penalty-card {
      min-height: clamp(9rem, 15vh, 12.5rem) !important;
    }

    @media (min-width: 112rem) {
      #boggle-top,
      #boggle-layout {
        max-width: 112rem !important;
      }

      #boggle-layout {
        grid-template-columns:
          minmax(21rem, 1fr)
          minmax(44rem, 1.72fr)
          minmax(21rem, 1fr) !important;
      }

      #board {
        width: min(100%, 52rem) !important;
      }

      #word-form,
      #word-feedback {
        width: min(100%, 52rem) !important;
      }
    }

    @media (max-width: 92rem) {
      #boggle-layout {
        grid-template-columns:
          minmax(16rem, 0.95fr)
          minmax(34rem, 1.62fr)
          minmax(16rem, 0.95fr) !important;
      }

      #play-status-panel {
        grid-template-columns: auto minmax(6rem, 1fr) auto !important;
      }

      #end-game {
        grid-column: 1 / -1 !important;
        justify-self: end !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-shell {
        width: 100% !important;
        margin-left: 0 !important;
        transform: none !important;
      }

      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #play-status-panel {
        grid-template-columns: auto 1fr !important;
      }

      #game-status {
        grid-column: 2 !important;
      }

      #timer,
      #end-game {
        grid-column: auto !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectMockupResponsiveThemeV7() {
  if (document.querySelector("#boggle-mockup-responsive-v7-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-responsive-v7-style";
  style.textContent = `
    /*
     * V7 : responsive vertical.
     * Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
     */

    :root {
      --top-space: clamp(0.9rem, 1.4vh, 1.35rem);
      --top-height-budget: clamp(5.2rem, 7vh, 6.35rem);
      --layout-available-height: calc(100vh - var(--top-height-budget) - 1.15rem);
      --board-max-side: min(42rem, calc(var(--layout-available-height) - 10.8rem));
    }

    #boggle-shell {
      min-height: 100vh !important;
      padding-top: var(--top-space) !important;
      padding-bottom: clamp(0.6rem, 1vh, 1rem) !important;
    }

    #boggle-top {
      min-height: auto !important;
      margin-bottom: clamp(0.95rem, 1.6vh, 1.35rem) !important;
      padding-top: 0.15rem !important;
      padding-bottom: 0.15rem !important;
    }

    #boggle-layout {
      min-height: 0 !important;
      height: min(var(--layout-available-height), 52rem) !important;
      align-items: stretch !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      height: 100% !important;
      min-height: 0 !important;
      overflow: visible !important;
    }

    #boggle-left {
      display: grid !important;
      grid-template-rows: minmax(10rem, 0.38fr) minmax(17rem, 0.92fr) !important;
      gap: clamp(0.8rem, 1.1vh, 1rem) !important;
    }

    #players-panel,
    #found-words-panel {
      height: auto !important;
      min-height: 0 !important;
    }

    #players-panel {
      display: flex !important;
      flex-direction: column !important;
    }

    #found-words-panel {
      display: flex !important;
      flex-direction: column !important;
    }

    #players,
    #found-words {
      min-height: 0 !important;
      flex: 1 1 auto !important;
    }

    #mockup-right-cards {
      height: 100% !important;
      display: grid !important;
      grid-template-rows: minmax(15rem, 1.35fr) minmax(7.2rem, 0.58fr) minmax(6.8rem, 0.52fr) !important;
      gap: clamp(0.75rem, 1vh, 1rem) !important;
      min-height: 0 !important;
    }

    #mockup-right-cards .mockup-info-card {
      min-height: 0 !important;
      overflow: hidden !important;
    }

    #mockup-help-card {
      min-height: 0 !important;
    }

    #mockup-unique-card,
    #mockup-penalty-card {
      min-height: 0 !important;
    }

    #boggle-center {
      display: grid !important;
      grid-template-rows: auto auto minmax(0, 1fr) auto auto !important;
      align-items: center !important;
      gap: 0 !important;
      height: 100% !important;
      padding: clamp(0.75rem, 1.2vh, 1rem) !important;
      min-height: 0 !important;
    }

    #launch-panel {
      margin-bottom: clamp(0.55rem, 0.9vh, 0.8rem) !important;
      padding-bottom: clamp(0.5rem, 0.8vh, 0.7rem) !important;
    }

    #start {
      height: clamp(3.05rem, 4.4vh, 3.55rem) !important;
      min-height: clamp(3.05rem, 4.4vh, 3.55rem) !important;
    }

    #mode-options-toggle {
      height: clamp(2.65rem, 3.9vh, 3.05rem) !important;
      min-height: clamp(2.65rem, 3.9vh, 3.05rem) !important;
    }

    #play-status-panel {
      margin: 0 0 clamp(0.55rem, 0.9vh, 0.75rem) !important;
      padding-bottom: clamp(0.35rem, 0.65vh, 0.55rem) !important;
      min-height: auto !important;
    }

    #play-status-panel > h2 {
      font-size: clamp(1.35rem, 2.1vw, 1.65rem) !important;
    }

    #game-status {
      font-size: clamp(0.88rem, 1vw, 1.02rem) !important;
    }

    #timer,
    #end-game {
      height: clamp(2.55rem, 4.1vh, 3rem) !important;
      min-height: clamp(2.55rem, 4.1vh, 3rem) !important;
    }

    #end-game {
      min-width: clamp(9.5rem, 11vw, 12rem) !important;
    }

    #board {
      align-self: center !important;
      width: min(100%, var(--board-max-side)) !important;
      max-width: 42rem !important;
      padding: clamp(0.72rem, 1vh, 1rem) !important;
      gap: clamp(0.42rem, 0.8vh, 0.68rem) !important;
    }

    #board .board-cell {
      min-height: clamp(3.9rem, 8.2vh, 6.25rem) !important;
      border-radius: clamp(0.8rem, 1.3vw, 1.1rem) !important;
    }

    #board .board-letter {
      font-size: clamp(1.8rem, 5.4vh, 3.35rem) !important;
    }

    #word-form {
      align-self: end !important;
      width: min(100%, 42rem) !important;
      margin-top: clamp(0.55rem, 0.9vh, 0.8rem) !important;
      min-height: clamp(4.25rem, 6.2vh, 5rem) !important;
      padding: clamp(0.55rem, 0.85vh, 0.75rem) !important;
      grid-template-columns: minmax(0, 1fr) minmax(9.5rem, auto) !important;
    }

    #word-input,
    #word-submit {
      height: clamp(3.05rem, 4.7vh, 3.55rem) !important;
      min-height: clamp(3.05rem, 4.7vh, 3.55rem) !important;
    }

    #word-submit {
      min-width: clamp(9.4rem, 10vw, 11rem) !important;
    }

    #word-feedback {
      align-self: end !important;
      width: min(100%, 42rem) !important;
      min-height: clamp(1.45rem, 2.6vh, 2rem) !important;
      margin-top: 0.2rem !important;
      font-size: clamp(0.88rem, 1vw, 1rem) !important;
    }

    .mockup-info-card h2 {
      font-size: clamp(1.08rem, 1.2vw, 1.36rem) !important;
      margin-bottom: clamp(0.55rem, 0.8vh, 0.8rem) !important;
      padding-bottom: clamp(0.45rem, 0.7vh, 0.7rem) !important;
    }

    .mockup-info-card p,
    .mockup-help-list li {
      font-size: clamp(0.83rem, 0.95vw, 1rem) !important;
      line-height: 1.32 !important;
    }

    .mockup-help-list {
      gap: clamp(0.45rem, 0.75vh, 0.72rem) !important;
      margin-top: clamp(0.55rem, 0.85vh, 0.8rem) !important;
    }

    .mockup-info-icon {
      width: clamp(1.9rem, 2.4vw, 2.3rem) !important;
      height: clamp(1.9rem, 2.4vw, 2.3rem) !important;
      font-size: clamp(1rem, 1.25vw, 1.25rem) !important;
    }

    #players-panel > h2,
    #found-words-panel > h2 {
      font-size: clamp(1.08rem, 1.2vw, 1.32rem) !important;
      margin-bottom: clamp(0.45rem, 0.8vh, 0.75rem) !important;
      padding-bottom: clamp(0.4rem, 0.75vh, 0.65rem) !important;
    }

    #players {
      --player-row-height: clamp(2rem, 3.4vh, 2.45rem) !important;
      --player-row-gap: clamp(0.18rem, 0.45vh, 0.32rem) !important;
    }

    .found-words-table {
      font-size: clamp(0.86rem, 0.95vw, 1rem) !important;
    }

    .found-words-header-cell {
      padding: clamp(0.32rem, 0.65vh, 0.52rem) 0.55rem !important;
    }

    .found-words-word,
    .found-words-points,
    .found-words-player {
      min-height: clamp(1.85rem, 3vh, 2.35rem) !important;
      padding-top: 0.24rem !important;
      padding-bottom: 0.24rem !important;
    }

    /*
     * Hauteurs modestes : on priorise tout visible.
     */
    @media (max-height: 840px) and (min-width: 78rem) {
      :root {
        --top-height-budget: 5.6rem;
        --layout-available-height: calc(100vh - 6.7rem);
        --board-max-side: min(39rem, calc(var(--layout-available-height) - 9.4rem));
      }

      #boggle-shell {
        padding-top: 0.55rem !important;
        padding-bottom: 0.55rem !important;
      }

      #boggle-top {
        margin-bottom: 0.65rem !important;
      }

      #boggle-center {
        padding: 0.7rem !important;
      }

      #launch-panel {
        margin-bottom: 0.45rem !important;
        padding-bottom: 0.45rem !important;
      }

      #start {
        height: 2.95rem !important;
        min-height: 2.95rem !important;
      }

      #mode-options-toggle {
        height: 2.5rem !important;
        min-height: 2.5rem !important;
      }

      #board {
        max-width: 39rem !important;
      }

      #board .board-cell {
        min-height: clamp(3.65rem, 7.4vh, 5.6rem) !important;
      }

      #word-form {
        min-height: 4.1rem !important;
      }
    }

    /*
     * Grandes hauteurs : on aère un peu le haut et les panneaux.
     */
    @media (min-height: 920px) and (min-width: 78rem) {
      #boggle-shell {
        padding-top: 1.15rem !important;
      }

      #boggle-top {
        margin-bottom: 1.25rem !important;
      }

      #boggle-layout {
        height: min(calc(100vh - 7.2rem), 55rem) !important;
      }

      #boggle-center {
        padding: 1.1rem !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-layout {
        height: auto !important;
      }

      #boggle-left,
      #boggle-center,
      #boggle-right,
      #mockup-right-cards {
        height: auto !important;
      }

      #boggle-left,
      #mockup-right-cards {
        display: flex !important;
      }

      #board {
        width: min(100%, 42rem) !important;
      }
    }
  `;

  document.head.appendChild(style);
}






function injectMockupStableTopCleanVictoryThemeV16() {
  if (document.querySelector("#boggle-mockup-stable-top-clean-victory-v16-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-stable-top-clean-victory-v16-style";
  style.textContent = `
    /*
     * V16 :
     * - on garde le centrage du haut ;
     * - on garde l'écran avant lancement ;
     * - on n'utilise plus #end-screen comme popup visible ;
     * - on crée #victory-modal-v16, indépendant des anciens styles.
     */

    #boggle-top {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      min-height: clamp(4.7rem, 7vh, 5.6rem) !important;
    }

    #boggle-brand {
      position: relative !important;
      z-index: 3 !important;
      flex: 0 0 auto !important;
    }

    #connection-controls {
      display: block !important;
      position: static !important;
      width: auto !important;
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }

    #connection-core {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: clamp(43rem, 46vw, 50rem) !important;
      display: grid !important;
      grid-template-columns:
        minmax(10.5rem, 14rem)
        minmax(10.5rem, 14rem)
        minmax(8.4rem, auto)
        8.8rem !important;
      gap: clamp(0.55rem, 0.8vw, 0.85rem) !important;
      align-items: end !important;
      z-index: 2 !important;
      pointer-events: auto !important;
    }

    #room-control {
      grid-column: 1 !important;
      justify-self: stretch !important;
      min-width: 0 !important;
    }

    #name-control {
      grid-column: 2 !important;
      justify-self: stretch !important;
      min-width: 0 !important;
    }

    #connect {
      grid-column: 3 !important;
      justify-self: center !important;
      align-self: end !important;
    }

    #status {
      grid-column: 4 !important;
      justify-self: start !important;
      align-self: end !important;
      width: 8.8rem !important;
      min-width: 8.8rem !important;
      box-sizing: border-box !important;
      padding-inline: 0.85rem !important;
    }

    #status[hidden] {
      display: inline-flex !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    #connection-actions {
      display: none !important;
    }

    #player-preferences {
      position: absolute !important;
      right: clamp(0.4rem, 1vw, 1.2rem) !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      z-index: 3 !important;
      margin: 0 !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])),
    #boggle-layout:has(#welcome-panel:not([hidden])) {
      height: auto !important;
      min-height: calc(100vh - 7.2rem) !important;
      align-items: start !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-center,
    #boggle-layout:has(#welcome-panel:not([hidden])) #boggle-center {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.9rem !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-left,
    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-right {
      height: auto !important;
      min-height: 0 !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-left {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #players-panel {
      height: auto !important;
      min-height: 12rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #found-words-panel {
      height: auto !important;
      min-height: 18rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #launch-panel {
      width: 100% !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: clamp(1rem, 1.4vw, 1.35rem) !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      border-radius: 1.75rem !important;
      background: rgba(255, 248, 232, 0.94) !important;
      box-shadow: 0 0.45rem 1rem rgba(104, 73, 40, 0.075) !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #play-status-panel {
      margin: 0 !important;
      padding: clamp(0.9rem, 1.2vw, 1.15rem) !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      border-radius: 1.65rem !important;
      background: rgba(255, 248, 232, 0.76) !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #board:empty,
    #boggle-layout:has(#launch-panel:not([hidden])) #word-form,
    #boggle-layout:has(#launch-panel:not([hidden])) #word-feedback {
      display: none !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #mockup-right-cards {
      height: auto !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) .mockup-info-card {
      min-height: auto !important;
      overflow: visible !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #mockup-help-card {
      min-height: 18rem !important;
    }

    body.boggle-end-screen-open {
      overflow: hidden !important;
    }

    body.boggle-end-screen-open #boggle-shell {
      filter: blur(3px) !important;
      pointer-events: none !important;
    }

    body.boggle-end-screen-open #end-screen {
      display: none !important;
    }

    body.boggle-end-screen-open #end-screen-backdrop {
      position: fixed !important;
      inset: 0 !important;
      z-index: 100000 !important;
      background: rgba(47, 34, 24, 0.36) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      cursor: pointer !important;
    }

    #victory-modal-v16 {
      position: fixed !important;
      inset: 0 !important;
      z-index: 100001 !important;

      width: min(40rem, calc(100vw - 2rem)) !important;
      max-width: min(40rem, calc(100vw - 2rem)) !important;
      height: fit-content !important;
      max-height: calc(100vh - 2rem) !important;
      overflow: visible !important;

      margin: auto !important;
      padding: 1.25rem !important;
      box-sizing: border-box !important;

      border: 2px solid rgba(90, 59, 35, 0.24) !important;
      border-radius: 1.35rem !important;
      background: #fff8ea !important;
      color: #4b3322 !important;
      box-shadow: 0 1.4rem 4rem rgba(32, 20, 12, 0.32) !important;

      filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      transform: none !important;
      opacity: 1 !important;
      isolation: isolate !important;
      pointer-events: auto !important;
      font-family: var(--cute-font, system-ui, sans-serif) !important;
    }

    #victory-modal-v16,
    #victory-modal-v16 * {
      filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      text-shadow: none !important;
    }

    #victory-modal-v16 > h2,
    #victory-modal-v16 h2:first-of-type {
      margin: 0 2.4rem 0.75rem 0 !important;
      font-size: clamp(1.55rem, 2.2vw, 2.2rem) !important;
      line-height: 1.05 !important;
      color: #6e3d1d !important;
    }

    #victory-modal-v16 h3 {
      margin: 0.75rem 0 0.45rem !important;
      font-size: clamp(1.08rem, 1.35vw, 1.35rem) !important;
      line-height: 1.1 !important;
      color: #6e3d1d !important;
    }

    #victory-modal-v16 p,
    #victory-modal-v16 li,
    #victory-modal-v16 td,
    #victory-modal-v16 th {
      font-size: clamp(0.88rem, 0.95vw, 1rem) !important;
      line-height: 1.25 !important;
    }

    #victory-modal-v16 table {
      width: 100% !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border-radius: 0.9rem !important;
      overflow: hidden !important;
      background: rgba(255, 250, 239, 0.95) !important;
      border: 1px solid rgba(111, 73, 40, 0.10) !important;
      margin-block: 0.55rem !important;
    }

    #victory-modal-v16 th {
      background: rgba(255, 232, 163, 0.88) !important;
      color: #6e3d1d !important;
      font-weight: 700 !important;
    }

    #victory-modal-v16 th,
    #victory-modal-v16 td {
      padding: 0.42rem 0.58rem !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.07) !important;
    }

    .victory-modal-close-v16 {
      position: absolute !important;
      top: 0.7rem !important;
      right: 0.7rem !important;
      z-index: 100002 !important;

      width: 2rem !important;
      height: 2rem !important;
      min-height: 2rem !important;
      padding: 0 !important;
      margin: 0 !important;

      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      border-radius: 999px !important;
      border: 1px solid rgba(90, 59, 35, 0.28) !important;
      background: #fff8ea !important;
      color: #4b3322 !important;
      font-size: 1.25rem !important;
      font-weight: 950 !important;
      line-height: 1 !important;
      box-shadow: 0 0.35rem 0.9rem rgba(32, 20, 12, 0.12) !important;
      cursor: pointer !important;
    }

    @media (min-width: 100rem) {
      #connection-core {
        width: clamp(46rem, 44vw, 52rem) !important;
        grid-template-columns:
          minmax(11rem, 14.5rem)
          minmax(11rem, 14.5rem)
          minmax(8.8rem, auto)
          8.9rem !important;
      }

      #status {
        width: 8.9rem !important;
        min-width: 8.9rem !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-top {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0.75rem !important;
      }

      #connection-controls {
        display: flex !important;
        flex-wrap: wrap !important;
      }

      #connection-core {
        position: static !important;
        transform: none !important;
        width: 100% !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
      }

      #status[hidden] {
        display: none !important;
      }

      #player-preferences {
        position: static !important;
        transform: none !important;
      }

      #victory-modal-v16 {
        width: calc(100vw - 1rem) !important;
        max-width: calc(100vw - 1rem) !important;
      }
    }
  `;

  document.head.appendChild(style);
}






function injectMockupRightRulesInputThemeV22() {
  if (document.querySelector("#boggle-mockup-help-titles-v22-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-mockup-help-titles-v22-style";
  style.textContent = `
    /*
     * V22 :
     * - conserve le look v21 ;
     * - bouton d'aide plus identifiable ;
     * - libellés plus courts pour éviter les dépassements ;
     * - titres gauche/droite harmonisés.
     */

    #mockup-help-card.rules-card {
      overflow: visible !important;
      pointer-events: auto !important;
    }

    #mockup-help-card.rules-card .mockup-help-list,
    #mockup-help-card.rules-card > p {
      display: none !important;
    }

    .rules-help-panel-v22 {
      display: grid !important;
      gap: 0.65rem !important;
      margin: 0.15rem 0 0 !important;
      padding: 0 !important;
      border: 0 !important;
      position: relative !important;
      z-index: 20 !important;
      pointer-events: auto !important;
    }

    .rules-help-actions-v22 {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 0.65rem !important;
    }

    .rules-help-level-v22 {
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      min-height: 2rem !important;
      padding: 0 0.75rem !important;
      border-radius: 999px !important;
      background: rgba(90, 59, 35, 0.08) !important;
      color: #5d351e !important;
      font-weight: 900 !important;
      font-size: clamp(0.9rem, 0.98vw, 1.04rem) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .rules-help-button-v22 {
      min-height: 2.75rem !important;
      padding: 0.6rem 1.18rem !important;
      border-radius: 999px !important;
      cursor: pointer !important;
      pointer-events: auto !important;
      position: relative !important;
      z-index: 30 !important;
      white-space: nowrap !important;
      background: #f4c430 !important;
      color: #4b3322 !important;
      border: 3px solid #7a4b1d !important;
      box-shadow:
        0 0.34rem 0 #c8921c,
        0 0.55rem 1rem rgba(97, 65, 35, 0.18) !important;
      font-weight: 950 !important;
      font-size: clamp(0.95rem, 1vw, 1.05rem) !important;
    }

    .rules-help-button-v22::after {
      content: "›";
      margin-left: 0.45rem;
      font-size: 1.15em;
      line-height: 1;
      font-weight: 950;
    }

    .rules-help-button-v22:hover,
    .rules-help-button-v22:focus-visible {
      transform: translateY(-1px);
      box-shadow:
        0 0.42rem 0 #c8921c,
        0 0.72rem 1.1rem rgba(97, 65, 35, 0.22) !important;
      outline: 3px solid rgba(244, 196, 48, 0.45) !important;
      outline-offset: 2px !important;
    }

    .rules-help-content-v22,
    .rules-help-content-v22 {
      display: grid !important;
      gap: 0.5rem !important;
      padding: 0.72rem 0 0 !important;
      border-top: 1px solid rgba(111, 73, 40, 0.13) !important;
    }

    .rules-help-content-title-v22,
    .rules-help-content-title-v22 {
      margin: 0 !important;
      color: #6e3d1d !important;
      font-weight: 950 !important;
      font-size: clamp(1rem, 1.08vw, 1.16rem) !important;
      line-height: 1.1 !important;
    }

    .rules-help-details-v22,
    .rules-help-details-v22 {
      display: grid !important;
      gap: 0.4rem !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }

    .rules-help-details-v22 li,
    .rules-help-details-v22 li {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      gap: 0.46rem !important;
      align-items: start !important;
      font-size: clamp(0.92rem, 1vw, 1.08rem) !important;
      line-height: 1.3 !important;
    }

    .rules-help-bullet-v22,
    .rules-help-bullet-v22 {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 1.55rem !important;
      height: 1.55rem !important;
      border-radius: 999px !important;
      background: rgba(255, 232, 163, 0.78) !important;
      color: #6e3d1d !important;
      font-weight: 950 !important;
      font-size: 0.75rem !important;
    }

    .rules-solution-list-v22,
    .rules-solution-list-v22 {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.35rem !important;
      max-height: clamp(9rem, 20vh, 14rem) !important;
      overflow-y: auto !important;
      padding: 0.3rem 0.15rem 0.1rem !important;
    }

    .rules-solution-chip-v22,
    .rules-solution-chip-v22 {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 1.65rem !important;
      padding: 0 0.55rem !important;
      border-radius: 999px !important;
      background: rgba(255, 250, 239, 0.95) !important;
      border: 1px solid rgba(111, 73, 40, 0.12) !important;
      color: #5d351e !important;
      font-weight: 800 !important;
      font-size: 0.88rem !important;
    }

    .mockup-option-status-v18,
    .mockup-option-status-v20 {
      display: none !important;
    }

    #mockup-unique-card[hidden],
    #mockup-penalty-card[hidden] {
      display: none !important;
    }

    #mockup-penalty-card strong {
      font-weight: 950 !important;
      color: #6e3d1d !important;
    }

    #mockup-right-cards .mockup-info-card h2,
    #players-panel > h2,
    #found-words-panel > h2 {
      font-size: clamp(1.45rem, 1.42vw, 1.68rem) !important;
      line-height: 1.08 !important;
      letter-spacing: -0.035em !important;
    }

    #mockup-right-cards .mockup-info-card p,
    #mockup-right-cards .mockup-info-card li {
      font-size: clamp(1rem, 1.05vw, 1.14rem) !important;
      line-height: 1.34 !important;
    }

    #players-panel > h2,
    #found-words-panel > h2 {
      margin-bottom: 0.9rem !important;
    }

    #word-form {
      width: min(100%, 49rem) !important;
      margin: clamp(1.15rem, 1.8vh, 1.65rem) auto 0 !important;
      min-height: auto !important;
      padding: 0.72rem 0.82rem !important;
      border: 0 !important;
      border-top: 0 !important;
      border-radius: 9999px !important;
      background: rgba(255, 248, 232, 0.96) !important;
      box-shadow: 0 0.35rem 1rem rgba(97, 65, 35, 0.08) !important;
      overflow: visible !important;
    }

    #word-form.boggle-feedback-host,
    #word-form.boggle-feedback-accepted,
    #word-form.boggle-feedback-invalid,
    #word-form.boggle-feedback-duplicate {
      outline: none !important;
      border-radius: 9999px !important;
    }

    #word-input,
    #word-submit {
      border-radius: 9999px !important;
    }

    #word-feedback {
      width: min(100%, 49rem) !important;
      margin: 0.35rem auto 0 !important;
      min-height: 1.55rem !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      text-align: center !important;
    }

    #word-feedback:empty {
      visibility: hidden !important;
    }

    #word-feedback:not(:empty) {
      visibility: visible !important;
      color: #5d351e !important;
      font-weight: 850 !important;
    }
  `;

  document.head.appendChild(style);
}





function injectFinalButtonsV34() {
  if (document.querySelector("#boggle-final-buttons-v34-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-final-buttons-v34-style";
  style.textContent = `
    /*
     * V34 : couche finale dédiée aux boutons et contrôles cliquables.
     * - bouton d'aide = bouton standard, sans effet 3D ;
     * - boutons grille personnalisée visibles et cohérents ;
     * - onglets joueurs lisibles ;
     * - tremblement discret sur saisie impossible, sans bloquer l'envoi.
     */

    #mockup-help-card .rules-help-button-v22,
    #mockup-help-card button.rules-help-button-v22 {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-width: 5.2rem !important;
      min-height: 2.45rem !important;
      padding: 0.45rem 0.9rem !important;
      border-radius: 0.8rem !important;
      background: #fff6df !important;
      background-image: none !important;
      color: #4b3322 !important;
      border: 2px solid rgba(122, 75, 29, 0.34) !important;
      box-shadow: 0 0.2rem 0.55rem rgba(97, 65, 35, 0.10) !important;
      font-weight: 900 !important;
      text-shadow: none !important;
      cursor: pointer !important;
      pointer-events: auto !important;
      transform: none !important;
      filter: none !important;
    }

    #mockup-help-card .rules-help-button-v22::after,
    #mockup-help-card button.rules-help-button-v22::after {
      content: none !important;
      display: none !important;
    }

    #mockup-help-card .rules-help-button-v22:hover,
    #mockup-help-card .rules-help-button-v22:focus-visible {
      background: #ffedc2 !important;
      transform: translateY(-1px) !important;
      filter: none !important;
      outline: 3px solid rgba(244, 196, 48, 0.28) !important;
      outline-offset: 2px !important;
      box-shadow: 0 0.25rem 0.6rem rgba(97, 65, 35, 0.13) !important;
    }

    #mode-controls #start-solution-mode,
    #mode-controls #fill-example-board {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 2.65rem !important;
      padding: 0.55rem 1rem !important;
      border-radius: 999px !important;
      background-image: none !important;
      color: #4b3322 !important;
      border: 2px solid rgba(122, 75, 29, 0.34) !important;
      box-shadow: 0 0.28rem 0.75rem rgba(97, 65, 35, 0.13) !important;
      font-weight: 950 !important;
      text-shadow: none !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    #mode-controls #start-solution-mode {
      background: #ea7e33 !important;
      color: #fff8f1 !important;
      border-color: rgba(126, 59, 18, 0.34) !important;
    }

    #mode-controls #fill-example-board {
      background: #fff6df !important;
      color: #4b3322 !important;
    }

    #mode-controls #start-solution-mode:hover,
    #mode-controls #fill-example-board:hover,
    #mode-controls #start-solution-mode:focus-visible,
    #mode-controls #fill-example-board:focus-visible {
      transform: translateY(-1px) !important;
      filter: none !important;
      outline: 3px solid rgba(244, 196, 48, 0.34) !important;
      outline-offset: 2px !important;
    }

    #found-words .found-words-player-tab,
    #found-words button.found-words-player-tab {
      background: #fff1d0 !important;
      color: #5d351e !important;
      border: 2px solid rgba(122, 75, 29, 0.22) !important;
      box-shadow: none !important;
      text-shadow: none !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    #found-words .found-words-player-tab[aria-selected="true"],
    #found-words button.found-words-player-tab[aria-selected="true"] {
      background: #ea7e33 !important;
      color: #fff8f1 !important;
      border-color: rgba(126, 59, 18, 0.32) !important;
    }

    #found-words .found-words-player-tab:not([aria-selected="true"]):hover,
    #found-words button.found-words-player-tab:not([aria-selected="true"]):hover,
    #found-words .found-words-player-tab:not([aria-selected="true"]):focus-visible,
    #found-words button.found-words-player-tab:not([aria-selected="true"]):focus-visible {
      background: #ffe5ad !important;
      color: #4b3322 !important;
      filter: none !important;
    }

    #word-input.boggle-keyboard-word-impossible {
      border-color: rgba(239, 81, 69, 0.52) !important;
      box-shadow:
        inset 0 0 0 2px rgba(255, 222, 216, 0.75),
        0 0 0 3px rgba(239, 81, 69, 0.12) !important;
      animation: boggle-keyboard-word-shake-v28 240ms ease-out;
    }

    @keyframes boggle-keyboard-word-shake-v28 {
      0%, 100% {
        transform: translateX(0);
      }

      25% {
        transform: translateX(-3px);
      }

      50% {
        transform: translateX(3px);
      }

      75% {
        transform: translateX(-1px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #word-input.boggle-keyboard-word-impossible {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}



function injectWordsPlayersLayoutV29() {
  if (document.querySelector("#boggle-words-players-layout-v29-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-words-players-layout-v29-style";
  style.textContent = `
    /*
     * V29 : espace plateau/saisie + liste mots par points + sélecteur joueur final/solution.
     */
    #boggle-center {
      overflow: visible !important;
    }

    #board {
      margin-bottom: 0.9rem !important;
      overflow: visible !important;
    }

    #word-form {
      margin-top: 0.75rem !important;
      position: relative !important;
      z-index: 2 !important;
    }

    #word-feedback {
      margin-top: 0.48rem !important;
    }

    .found-words-viewer {
      display: grid !important;
      gap: 0.65rem !important;
      min-height: 0 !important;
    }

    .found-words-player-tabs {
      display: flex !important;
      gap: 0.4rem !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      padding: 0.25rem !important;
      border-radius: 999px !important;
      background: rgba(90, 59, 35, 0.06) !important;
    }

    .found-words-player-tab {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 2rem !important;
      padding: 0.35rem 0.75rem !important;
      border-radius: 999px !important;
      border: 1px solid rgba(122, 75, 29, 0.16) !important;
      background: rgba(255, 250, 236, 0.82) !important;
      color: #5d351e !important;
      font-weight: 900 !important;
      cursor: pointer !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    .found-words-player-tab[aria-selected="true"] {
      background: #ea7e33 !important;
      color: #fff8f1 !important;
      border-color: rgba(126, 59, 18, 0.28) !important;
    }

    .found-words-player-tab:hover,
    .found-words-player-tab:focus-visible {
      transform: translateY(-1px) !important;
      outline: 3px solid rgba(244, 196, 48, 0.28) !important;
      outline-offset: 2px !important;
      filter: none !important;
    }

    .found-words-summary {
      display: flex !important;
      justify-content: space-between !important;
      gap: 0.6rem !important;
      align-items: center !important;
      padding: 0.4rem 0.65rem !important;
      border-radius: 999px !important;
      background: rgba(255, 246, 224, 0.74) !important;
      color: #5d351e !important;
      font-weight: 950 !important;
    }

    .found-words-table {
      grid-template-columns: minmax(0, 1fr) auto !important;
      gap: 0.24rem 0.48rem !important;
      align-items: center !important;
    }

    .found-words-header-cell {
      color: rgba(93, 53, 30, 0.76) !important;
      font-weight: 950 !important;
    }

    .found-words-row {
      display: contents !important;
    }

    .found-words-word {
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      gap: 0.4rem !important;
      padding: 0.28rem 0.35rem !important;
      border-radius: 0.7rem !important;
    }

    .found-words-word strong {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .found-words-points {
      justify-self: end !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 2rem !important;
      min-height: 1.65rem !important;
      padding: 0.12rem 0.48rem !important;
      border-radius: 999px !important;
      font-weight: 950 !important;
      font-variant-numeric: tabular-nums !important;
    }

    .found-word-dot {
      width: 0.65rem !important;
      height: 0.65rem !important;
      min-width: 0.65rem !important;
      border-radius: 999px !important;
      background: currentColor !important;
      opacity: 0.95 !important;
    }

    .found-word-score-1 {
      color: #6a3e1f !important;
      background: rgba(90, 59, 35, 0.05) !important;
    }

    .found-word-score-2 {
      color: #137a48 !important;
      background: rgba(24, 147, 86, 0.09) !important;
    }

    .found-word-score-3 {
      color: #1468c7 !important;
      background: rgba(20, 104, 199, 0.10) !important;
    }

    .found-word-score-5 {
      color: #7d3fc7 !important;
      background: rgba(125, 63, 199, 0.11) !important;
    }

    .found-word-score-11 {
      color: #d42323 !important;
      background: rgba(212, 35, 35, 0.11) !important;
    }

    .found-word-score-1 .found-words-points { background: rgba(90, 59, 35, 0.10) !important; }
    .found-word-score-2 .found-words-points { background: rgba(24, 147, 86, 0.16) !important; }
    .found-word-score-3 .found-words-points { background: rgba(20, 104, 199, 0.17) !important; }
    .found-word-score-5 .found-words-points { background: rgba(125, 63, 199, 0.18) !important; }
    .found-word-score-11 .found-words-points { background: rgba(212, 35, 35, 0.18) !important; }

    .found-words-empty-row {
      grid-column: 1 / -1 !important;
    }
  `;

  document.head.appendChild(style);
}



function injectFinalRecapHoverV30() {
  if (document.querySelector("#boggle-final-recap-hover-v30-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-final-recap-hover-v30-style";
  style.textContent = `
    /*
     * V30 : règles fiables plateau/saisie + panneau mots seamless + hover de mot.
     */

    #boggle-center {
      display: grid !important;
      grid-template-rows: auto minmax(0, auto) auto auto !important;
      align-items: start !important;
      overflow: visible !important;
      gap: clamp(0.58rem, 1.05vh, 0.95rem) !important;
    }

    #play-status-panel {
      grid-row: 1 !important;
    }

    #board {
      grid-row: 2 !important;
      justify-self: center !important;
      align-self: center !important;
      width: min(100%, 42rem, calc(100dvh - 17.75rem)) !important;
      max-width: 100% !important;
      height: auto !important;
      aspect-ratio: 1 / 1 !important;
      margin: 0 auto !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    #word-form {
      grid-row: 3 !important;
      justify-self: center !important;
      width: min(100%, 43rem) !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      transform: none !important;
      position: relative !important;
      z-index: 2 !important;
    }

    #word-feedback {
      grid-row: 4 !important;
      width: min(100%, 43rem) !important;
      margin: 0.16rem auto 0 !important;
    }

    @media (max-height: 760px) {
      #board {
        width: min(100%, 38rem, calc(100dvh - 15.8rem)) !important;
      }

      #boggle-center {
        gap: 0.5rem !important;
      }
    }

    @media (max-width: 78rem) {
      #board {
        width: min(100%, 42rem) !important;
      }
    }

    #found-words {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    .found-words-viewer {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    .found-words-summary {
      background: rgba(255, 248, 231, 0.72) !important;
      border: 1px solid rgba(122, 75, 29, 0.14) !important;
      box-shadow: none !important;
    }

    .found-words-table {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0.15rem 0 !important;
    }

    .found-words-header-cell {
      background: transparent !important;
      border: 0 !important;
      color: rgba(93, 53, 30, 0.68) !important;
      padding: 0.18rem 0.32rem !important;
    }

    .found-words-row {
      border-radius: 0.65rem !important;
    }

    .found-words-word {
      background: transparent !important;
      color: #25150d !important;
    }

    .found-words-word strong {
      color: #25150d !important;
    }

    .found-word-dot {
      box-shadow: 0 0 0 2px rgba(255,255,255,0.72) !important;
    }

    .found-word-score-1 .found-word-dot { color: #21a663 !important; }
    .found-word-score-2 .found-word-dot { color: #16824f !important; }
    .found-word-score-3 .found-word-dot { color: #1468c7 !important; }
    .found-word-score-5 .found-word-dot { color: #7d3fc7 !important; }
    .found-word-score-11 .found-word-dot { color: #d42323 !important; }

    .found-word-score-1,
    .found-word-score-2,
    .found-word-score-3,
    .found-word-score-5,
    .found-word-score-11 {
      color: #25150d !important;
      background: transparent !important;
    }

    .found-word-score-1 .found-words-points { background: rgba(33, 166, 99, 0.14) !important; color: #14653c !important; }
    .found-word-score-2 .found-words-points { background: rgba(22, 130, 79, 0.15) !important; color: #105a38 !important; }
    .found-word-score-3 .found-words-points { background: rgba(20, 104, 199, 0.15) !important; color: #0f4d95 !important; }
    .found-word-score-5 .found-words-points { background: rgba(125, 63, 199, 0.16) !important; color: #622aa6 !important; }
    .found-word-score-11 .found-words-points { background: rgba(212, 35, 35, 0.16) !important; color: #a31818 !important; }

    .found-words-empty-row {
      background: transparent !important;
      border: 0 !important;
      color: rgba(37, 21, 13, 0.72) !important;
      padding: 0.45rem 0.32rem !important;
    }

    .found-words-row.has-hover-path .found-words-word {
      cursor: pointer !important;
    }
  `;

  document.head.appendChild(style);
}



function injectBoardFitAndTabsV31() {
  if (document.querySelector("#boggle-board-fit-tabs-v31-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "boggle-board-fit-tabs-v31-style";
  style.textContent = `
    /*
     * V31 : verrou de layout fiable.
     * Le plateau reçoit une taille calculée par JS dans --board-fit-size-v31.
     * Le formulaire reste dans le flux, sous la grille, sans superposition.
     */
    #boggle-center {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      justify-content: flex-start !important;
      overflow: visible !important;
      gap: 0.72rem !important;
      contain: none !important;
    }

    #play-status-panel {
      flex: 0 0 auto !important;
      margin-bottom: 0 !important;
    }

    #board {
      flex: 0 0 auto !important;
      align-self: center !important;
      width: var(--board-fit-size-v31, min(100%, 36rem)) !important;
      height: var(--board-fit-size-v31, min(100vw, 36rem)) !important;
      max-width: 100% !important;
      max-height: var(--board-fit-size-v31, 36rem) !important;
      aspect-ratio: 1 / 1 !important;
      margin: 0 auto !important;
      transform: none !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    #word-form {
      flex: 0 0 auto !important;
      align-self: center !important;
      width: min(100%, 43rem) !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      transform: none !important;
      position: relative !important;
      z-index: 2 !important;
    }

    #word-feedback {
      flex: 0 0 auto !important;
      align-self: center !important;
      width: min(100%, 43rem) !important;
      margin: 0 auto !important;
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
