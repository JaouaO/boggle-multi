export function createRoomSocket(roomId) {
	const protocol = location.protocol === "https:" ? "wss:" : "ws:";
	const url = `${protocol}//${location.host}/ws/${encodeURIComponent(roomId)}`;

	return {
		url,
		socket: new WebSocket(url),
	};
}

export function sendMessage(socket, data) {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		return false;
	}

	socket.send(JSON.stringify(data));
	return true;
}
