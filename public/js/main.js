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

const DEFAULT_DURATION_SECONDS = 180;

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

connectButton.addEventListener("click", connectToRoom);
startButton.addEventListener("click", startGame);
wordForm.addEventListener("submit", submitWord);

function submitWord(event) {
  event.preventDefault();

  const word = wordInput.value.trim();

  if (!word) {
    return;
  }

  send({
    type: "submitWord",
    word,
  });

  wordInput.value = "";
  wordInput.focus();
}

resetGameUiToWaiting();

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

function startGame() {
  send({
    type: "startGame",
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
    addLog(logElement, `Room connectée : ${data.roomId}`);
    return;
  }

  if (data.type === "system") {
    addLog(logElement, `[système] ${data.text}`);
    return;
  }

  if (data.type === "players") {
    renderPlayers(playersElement, data.players);
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

  refreshHelpDisplay();
  renderCurrentBoardWithHelp();
}

function handleWordRejected(data) {
  setWordFeedback(
    wordFeedbackElement,
    `${data.word || "Mot"} refusé : ${data.reason}`
  );
}

function handleSolutionsStats(data) {
  state.solutionsStats = data;
  state.solutionCellWords = data.cellWords || [];

  refreshHelpDisplay();

  if (state.board) {
    renderCurrentBoardWithHelp();
  }

  addLog(
    logElement,
    `Solutions calculées : ${data.totalWords} mot(s), ${data.maxScore} point(s) max, calcul en ${data.solveDurationMs} ms.`
  );
}

function handleBoardCellClick({ row, col, letter }) {
  if (state.helpLevel < 2) {
    return;
  }

  const words = state.solutionCellWords?.[row]?.[col] || [];

  state.selectedHelpCell = {
    row,
    col,
    letter,
    words,
  };

  refreshHelpDisplay();
}

function changeHelpLevel() {
  state.helpLevel = getNextHelpLevel(state.helpLevel);
  state.selectedHelpCell = null;

  refreshHelpDisplay();
  renderCurrentBoardWithHelp();
}

function handleGameStarted(data) {
  state.gameStatus = "playing";
  state.board = data.board;
  state.startedAt = data.startedAt;
  state.endedAt = null;
  state.durationSeconds = data.durationSeconds;
  state.foundWords = [];
  state.score = 0;
  state.solutionCellWords = [];
  state.solutionsStats = null;
  state.selectedHelpCell = null;

  renderFoundWords(foundWordsElement, state.foundWords);
  setWordFeedback(wordFeedbackElement, "");

  wordInput.disabled = false;
  wordSubmitButton.disabled = false;

  refreshHelpDisplay();
  renderCurrentBoardWithHelp();
  updateGameStatus("playing");

  startButton.disabled = true;

  startLocalTimer({
    timerElement,
    startedAt: data.startedAt,
    durationSeconds: data.durationSeconds,
    onEnd: () => {
      updateGameStatus("ended");
    },
  });

  const startDate = new Date(data.startedAt);

  addLog(
    logElement,
    `Nouvelle grille reçue. Début officiel : ${startDate.toLocaleTimeString()} — durée : ${data.durationSeconds}s`
  );
}

function handleGameEnded(data) {
  state.gameStatus = "ended";
  state.board = data.board;
  state.startedAt = data.startedAt;
  state.endedAt = data.endedAt;
  state.durationSeconds = data.durationSeconds;

  renderCurrentBoardWithHelp();
  renderTimer(timerElement, 0);
  stopLocalTimer();

  updateGameStatus("ended");
  startButton.disabled = false;

  const endDate = new Date(data.endedAt);

  wordInput.disabled = true;
  wordSubmitButton.disabled = true;

  addLog(
    logElement,
    `Partie terminée à ${endDate.toLocaleTimeString()}.`
  );
}

function refreshHelpDisplay() {
  renderHelpPanel(boardElement, {
    helpLevel: state.helpLevel,
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
  renderBoard(boardElement, state.board, {
    onCellClick: handleBoardCellClick,
    cellCounts: state.solutionsStats?.cellCounts || [],
    foundCellCounts: createFoundCellCounts(),
    showCounts: state.helpLevel >= 1,
    canClickCells: state.helpLevel >= 2,
  });
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

    state.foundWords = [];
    state.score = 0;
    state.solutionCellWords = [];
    state.solutionsStats = null;
    state.selectedHelpCell = null;

    renderFoundWords(foundWordsElement, state.foundWords);
    setWordFeedback(wordFeedbackElement, "");
    refreshHelpDisplay();

    wordInput.disabled = true;
    wordSubmitButton.disabled = true;

    boardElement.innerHTML = "";
    renderTimer(timerElement, DEFAULT_DURATION_SECONDS);

    gameStatusElement.textContent = "En attente de lancement";
    startButton.disabled = !state.socket;

    return;
  }

  if (status === "playing") {
    gameStatusElement.textContent = "Partie en cours";
    startButton.disabled = true;
    return;
  }

  if (status === "ended") {
    stopLocalTimer();

    gameStatusElement.textContent = "Partie terminée";
    startButton.disabled = !state.socket;
    wordInput.disabled = true;
    wordSubmitButton.disabled = true;

    return;
  }
}

function resetGameUiToWaiting() {
  state.gameStatus = "waiting";
  state.board = null;
  state.startedAt = null;
  state.endedAt = null;
  state.durationSeconds = DEFAULT_DURATION_SECONDS;

  boardElement.innerHTML = "";
  gameStatusElement.textContent = "En attente de lancement";
  renderTimer(timerElement, DEFAULT_DURATION_SECONDS);

  startButton.disabled = !state.socket;
  state.foundWords = [];
  state.score = 0;
  state.solutionCellWords = [];
  state.solutionsStats = null;
  state.selectedHelpCell = null;

  renderFoundWords(foundWordsElement, state.foundWords);
  setWordFeedback(wordFeedbackElement, "");
  refreshHelpDisplay();

  wordInput.disabled = true;
  wordSubmitButton.disabled = true;
}
