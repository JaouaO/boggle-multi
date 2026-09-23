import { state } from "./core/state.js";
import { createRoomSocket, sendMessage } from "./net/socket.js";
import { renderBoard } from "./ui/board-ui.js";
import { renderPlayers } from "./ui/players-ui.js";
import { addLog } from "./ui/log-ui.js";
import {
	renderTimer,
	startLocalTimer,
	stopLocalTimer,
} from "./ui/timer-ui.js";

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

connectButton.addEventListener("click", connectToRoom);
startButton.addEventListener("click", startGame);

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

	addLog(logElement, `Message serveur inconnu : ${JSON.stringify(data)}`);
}

function handleGameStarted(data) {
	state.gameStatus = "playing";
	state.board = data.board;
	state.startedAt = data.startedAt;
	state.endedAt = null;
	state.durationSeconds = data.durationSeconds;

	renderBoard(boardElement, data.board);
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

	renderBoard(boardElement, data.board);
	renderTimer(timerElement, 0);
	stopLocalTimer();

	updateGameStatus("ended");
	startButton.disabled = false;

	const endDate = new Date(data.endedAt);

	addLog(
		logElement,
		`Partie terminée à ${endDate.toLocaleTimeString()}.`
	);
}

function updateGameStatus(status) {
	state.gameStatus = status;

	if (status === "waiting") {
		stopLocalTimer();

		state.board = null;
		state.startedAt = null;
		state.endedAt = null;
		state.durationSeconds = DEFAULT_DURATION_SECONDS;

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
}
