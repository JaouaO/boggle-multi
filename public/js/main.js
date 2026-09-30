import { state } from "./core/state.js";
import { createRoomSocket, sendMessage } from "./net/socket.js";
import { renderBoard } from "./ui/board-ui.js";
import { renderPlayers } from "./ui/players-ui.js";
import { addLog } from "./ui/log-ui.js";
import {
  renderFoundWords,
  setWordFeedback,
} from "./ui/words-ui.js";
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
import { getGameOptions, renderModeControls } from "./ui/mode-ui.js";
import { renderMouseInputPanel } from "./ui/mouse-input-ui.js";
import { setupAppLayout } from "./ui/layout-ui.js";
import { runSubmissionFeedback } from "./ui/feedback-ui.js";

const DEFAULT_DURATION_SECONDS = 180;

let pendingSubmissionPath = [];

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

const endGameButton = document.createElement("button");
endGameButton.id = "end-game";
endGameButton.type = "button";
endGameButton.textContent = "Terminer la partie";
endGameButton.hidden = true;
endGameButton.style.background = "#a9433f";
endGameButton.style.color = "#fff";
endGameButton.addEventListener("click", () => {
  send({
    type: "endGame",
  });
});

timerElement.insertAdjacentElement("afterend", endGameButton);

connectButton.addEventListener("click", connectToRoom);
startButton.addEventListener("click", startRandomTimedGame);
wordForm.addEventListener("submit", submitWord);

startButton.textContent = "Lancer une grille aléatoire";

renderModePanel();

renderMouseInputPanel(wordForm, {
  word: "",
  onSubmit: submitSelectedWord,
  onClear: clearSelectedLetters,
});

setupAppLayout();

resetGameUiToWaiting();

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

  if (state.socket) {
    state.socket.close();
  }

  stopLocalTimer();
  resetGameUiToWaiting();

  state.roomId = roomId;
  state.playerName = playerName;

  const { socket, url } = createRoomSocket(roomId);
  state.socket = socket;

  socket.addEventListener("open", () => {
    if (state.socket !== socket) {
      return;
    }

    statusElement.textContent = `Connecté à la room ${roomId}`;
    startButton.disabled = false;

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
    startButton.disabled = true;
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
  send({
    type: "startGame",
    mode: "timed",
    options: getGameOptions(),
  });
}

function startSolutionMode(board) {
  send({
    type: "startGame",
    mode: "solution",
    board,
    options: {
      ...getGameOptions(),
      durationMode: "noTimer",
    },
  });
}

function send(data) {
  const sent = sendMessage(state.socket, data);

  if (!sent) {
    addLog(logElement, "Socket non connectée.");
  }
}

function handleServerMessage(data) {
  if (data.type === "connected") {
    state.playerId = data.playerId;
    addLog(logElement, `Room connectée : ${data.roomId}`);
    return;
  }

  if (data.type === "system") {
    addLog(logElement, `[système] ${data.text}`);
    return;
  }

  if (data.type === "players") {
    state.players = data.players;
    renderPlayers(playersElement, data.players);

    if (state.endScreenVisible) {
      renderCurrentEndScreen();
    }

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
    options: state.gameOptions,
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
    options: state.gameOptions,
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
    timerElement.textContent = "Objectif de score";
    return;
  }

  timerElement.textContent = `Objectif : ${targetScore} pt(s)`;
}

function handleSolutionsStats(data) {
  state.solutionsStats = data;
  state.solutionCellWords = data.cellWords || [];

  refreshHelpDisplay();

  if (state.board) {
    renderCurrentBoardWithHelp();
  }

  renderTargetScoreStatus();

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
  if (!state.isDraggingLetters) {
    return;
  }

  const cell = { row, col, letter };
  const lastCell = state.dragPath[state.dragPath.length - 1];

  if (!lastCell) {
    state.dragPath = [cell];
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

  const draggedWord = pathToWord(state.dragPath);
  const wasDragSelection = state.dragMoved;

  state.isDraggingLetters = false;
  state.suppressNextCellClick = true;

  if (wasDragSelection && draggedWord.length >= 3) {
    state.selectedPath = state.dragPath;
    state.selectedWord = draggedWord;
    submitSelectedWord();
    state.dragPath = [];
    state.dragMoved = false;
    return;
  }

  state.dragPath = [];
  state.dragMoved = false;

  if (!wasDragSelection && state.helpLevel >= 2) {
    updateHelpCell({ row, col, letter });
    updateWordInputFromPath(state.selectedPath);
    renderCurrentBoardWithHelp();
    renderMousePanel();
    return;
  }

  if (!wasDragSelection) {
    addClickedLetterToSelection({ row, col, letter });
    return;
  }

  updateWordInputFromPath(state.selectedPath);
  renderCurrentBoardWithHelp();
  renderMousePanel();
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
  state.gameOptions = data.gameOptions ?? {
    durationMode: data.durationSeconds > 0 ? "timer" : "noTimer",
    durationSeconds: data.durationSeconds,
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
  clampCurrentHelpLevel();

  hideEndScreen();
  renderFoundWords(foundWordsElement, state.foundWords);
  setWordFeedback(wordFeedbackElement, "");

  wordInput.disabled = false;
  wordSubmitButton.disabled = false;
  endGameButton.hidden = false;

  refreshHelpDisplay();
  renderCurrentBoardWithHelp();
  renderMousePanel();
  updateGameStatus("playing");

  renderModePanel();

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
          ? "Objectif de score"
          : "Sans timer";
    startButton.disabled = false;
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
  state.gameOptions = data.gameOptions ?? {
    durationMode: data.durationSeconds > 0 ? "timer" : "noTimer",
    durationSeconds: data.durationSeconds,
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
  startButton.disabled = false;

  const endDate = new Date(data.endedAt);

  wordInput.disabled = true;
  wordSubmitButton.disabled = true;
  endGameButton.hidden = true;

  renderCurrentEndScreen();
  renderModePanel();

  addLog(
    logElement,
    `Partie terminée à ${endDate.toLocaleTimeString()} — temps écoulé : ${getElapsedDurationSeconds()}s.`
  );
}

function renderModePanel() {
  renderModeControls(startButton, {
    visible: state.gameStatus !== "playing",
    disabled: !state.socket,
    onStartSolution: startSolutionMode,
  });
}

function refreshHelpDisplay() {
  renderHelpPanel(wordForm, {
    helpLevel: Math.min(state.helpLevel, getMaxHelpLevel()),
    maxHelpLevel: getMaxHelpLevel(),
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
    onCellPointerUp: handleCellPointerUp,
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
    state.gameOptions = {
      durationMode: "timer",
      durationSeconds: DEFAULT_DURATION_SECONDS,
    };

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
    endGameButton.hidden = true;

    boardElement.innerHTML = "";
    renderTimer(timerElement, DEFAULT_DURATION_SECONDS);

    gameStatusElement.textContent = "En attente de lancement";
    startButton.disabled = !state.socket;
    renderModePanel();

    return;
  }

  if (status === "playing") {
    gameStatusElement.textContent =
      state.gameMode === "solution"
        ? "Mode solution"
        : state.gameOptions.durationMode === "targetScore"
          ? "Objectif de score"
          : state.gameOptions.durationMode === "noTimer"
            ? "Partie sans timer"
            : "Partie en cours";

    startButton.disabled =
      state.gameMode === "timed" && state.gameOptions.durationMode === "timer";
    renderModePanel();
    return;
  }

  if (status === "ended") {
    stopLocalTimer();

    gameStatusElement.textContent = "Partie terminée";
    startButton.disabled = !state.socket;
    renderModePanel();
    wordInput.disabled = true;
    wordSubmitButton.disabled = true;
    endGameButton.hidden = true;

    return;
  }
}

function resetGameUiToWaiting() {
  state.gameStatus = "waiting";
  state.gameMode = "timed";
  state.gameOptions = {
    durationMode: "timer",
    durationSeconds: DEFAULT_DURATION_SECONDS,
  };
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
  endGameButton.hidden = true;
}
