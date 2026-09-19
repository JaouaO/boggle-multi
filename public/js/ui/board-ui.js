export function renderBoard(boardElement, board) {
	boardElement.innerHTML = "";

	for (const row of board) {
		for (const letter of row) {
			const cell = document.createElement("div");
			cell.className = "cell";
			cell.textContent = letter;
			boardElement.appendChild(cell);
		}
	}
}
