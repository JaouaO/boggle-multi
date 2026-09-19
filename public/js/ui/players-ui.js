export function renderPlayers(playersElement, players) {
	playersElement.innerHTML = "";

	for (const player of players) {
		const li = document.createElement("li");
		li.textContent = player;
		playersElement.appendChild(li);
	}
}
