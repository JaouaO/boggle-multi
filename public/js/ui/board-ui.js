export function renderBoard(boardElement, board, options = {}) {
  boardElement.innerHTML = "";

  if (!board) {
    return;
  }

  const showCounts = Boolean(options.showCounts);
  const canClickCells = Boolean(options.canClickCells);

  boardElement.style.display = "grid";
  boardElement.style.gridTemplateColumns = `repeat(${board[0]?.length || 0}, minmax(48px, 1fr))`;
  boardElement.style.gap = "0.5rem";

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = document.createElement("button");
      const letter = board[row][col];
      const possibleCount = options.cellCounts?.[row]?.[col] ?? null;
      const foundCount = options.foundCellCounts?.[row]?.[col] ?? 0;

      cell.type = "button";
      cell.className = "board-cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.dataset.letter = letter;

      cell.style.position = "relative";
      cell.style.minHeight = "56px";
      cell.style.cursor = canClickCells ? "pointer" : "default";

      if (showCounts && possibleCount !== null) {
        cell.title = `${foundCount}/${possibleCount} mot(s) trouvé(s)/possible(s)`;
      } else if (canClickCells) {
        cell.title = "Cliquez pour voir les mots possibles avec cette lettre.";
      } else {
        cell.title = "";
      }

      const letterElement = document.createElement("span");
      letterElement.className = "board-letter";
      letterElement.textContent = letter;

      cell.appendChild(letterElement);

      if (showCounts && possibleCount !== null) {
        const countElement = document.createElement("span");
        countElement.className = "board-count";
        countElement.textContent = `${foundCount}/${possibleCount}`;
        countElement.style.position = "absolute";
        countElement.style.right = "0.25rem";
        countElement.style.bottom = "0.15rem";
        countElement.style.fontSize = "0.7rem";
        countElement.style.opacity = "0.75";

        cell.appendChild(countElement);
      }

      if (canClickCells) {
        cell.addEventListener("click", () => {
          options.onCellClick?.({
            row,
            col,
            letter,
          });
        });
      }

      boardElement.appendChild(cell);
    }
  }
}
