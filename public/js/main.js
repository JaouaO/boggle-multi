import { state } from "./core/state.js";
import { createRoomSocket, sendMessage } from "./net/socket.js";
import { renderBoard } from "./ui/board-ui.js";
import { renderPlayers } from "./ui/players-ui.js";
import { addLog } from "./ui/log-ui.js";

const roomInput = document.querySelector("#room");
const nameInput = document.querySelector("#name");
const connectButton = document.querySelector("#connect");
const startButton = document.querySelector("#start");
const statusElement = document.querySelector("#status");
const playersElement = document.querySelector("#players");
const boardElement = document.querySelector("#board");
const logElement = document.querySelector("#log");

connectButton.addEventListener("click", connectToRoom);
startButton.addEventListener("click", startGame);

function connectToRoom() {
	const roomId = roomInput.value.trim() || "TEST";
	const playerName = nameInput.value.trim() || "joueur";

	if (state.socket) {
		state.socket.close();
	}

	state.roomId = roomId;
	state.playerName = playerName;

	const { socket, url } = createRoomSocket(roomId);
	state.socket = socket;

	socket.addEventListener("open", () => {
		statusElement.textContent = `Connecté à la room ${roomId}`;
		startButton.disabled = false;

		addLog(logElement, `Connecté à ${url}`);

		send({
			type: "join",
			name: playerName,
		});
	});

	socket.addEventListener("message", (event) => {
		const data = JSON.parse(event.data);
		handleServerMessage(data);
	});

	socket.addEventListener("close", () => {
		statusElement.textContent = "Déconnecté";
		startButton.disabled = true;
		addLog(logElement, "Connexion fermée.");
	});

	socket.addEventListener("error", () => {
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

	if (data.type === "gameStarted") {
		state.board = data.board;
		state.startedAt = data.startedAt;
		state.durationSeconds = data.durationSeconds;

		renderBoard(boardElement, data.board);

		const startDate = new Date(data.startedAt);

		addLog(
			logElement,
			`Nouvelle grille reçue. Début officiel : ${startDate.toLocaleTimeString()} — durée : ${data.durationSeconds}s`
		);

		return;
	}

	addLog(logElement, `Message serveur inconnu : ${JSON.stringify(data)}`);
}
