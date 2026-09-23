export function renderPlayers(playersElement, players) {
	playersElement.innerHTML = "";

	for (const player of players) {
		const li = document.createElement("li");

		if (typeof player === "string") {
			li.textContent = player;
		} else {
			li.textContent = `${player.name} — ${player.score} pt — ${player.wordCount} mot(s)`;
		}

		playersElement.appendChild(li);
	}
}
