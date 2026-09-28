export function renderBoard(boardElement, board, options = {}) {
  boardElement.innerHTML = "";

  if (!board) {
    return;
  }

  const showCounts = Boolean(options.showCounts);
  const canClickCells = Boolean(options.canClickCells);
  const canShowCellHelp = Boolean(options.canShowCellHelp);
  const selectedKeys = new Set(options.selectedCells || []);

  boardElement.style.display = "grid";
  boardElement.style.gridTemplateColumns = `repeat(${board[0]?.length || 0}, minmax(48px, 1fr))`;
  boardElement.style.gap = "0.5rem";
  boardElement.style.userSelect = "none";
  boardElement.style.touchAction = "none";

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = document.createElement("button");
      const letter = board[row][col];
      const possibleCount = options.cellCounts?.[row]?.[col] ?? null;
      const foundCount = options.foundCellCounts?.[row]?.[col] ?? 0;
      const cellKey = `${row}:${col}`;

      cell.type = "button";
      cell.className = selectedKeys.has(cellKey)
        ? "board-cell board-cell-selected"
        : "board-cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.dataset.letter = letter;

      cell.style.position = "relative";
      cell.style.minHeight = "56px";
      cell.style.cursor = canClickCells ? "pointer" : "default";

      if (selectedKeys.has(cellKey)) {
        cell.style.outline = "3px solid #2563eb";
        cell.style.transform = "translateY(-1px)";
      }

      if (showCounts && possibleCount !== null) {
        cell.title = `${foundCount}/${possibleCount} mot(s) trouvé(s)/possible(s)`;
      } else if (canClickCells) {
        cell.title = "Cliquez pour sélectionner cette lettre.";
      } else {
        cell.title = "";
      }

      const letterElement = document.createElement("span");
      letterElement.className = "board-letter";
      letterElement.textContent = letter;

      cell.appendChild(letterElement);

      if (showCounts && possibleCount !== null) {
        const countElement = document.createElement(
          canShowCellHelp ? "button" : "span"
        );

        countElement.className = canShowCellHelp
          ? "board-count board-count-help"
          : "board-count";

        countElement.textContent = `${foundCount}/${possibleCount}`;
        countElement.style.position = "absolute";
        countElement.style.right = "0.25rem";
        countElement.style.bottom = "0.15rem";
        countElement.style.fontSize = "0.7rem";
        countElement.style.opacity = "0.85";
        countElement.style.border = canShowCellHelp ? "1px solid #ddd" : "0";
        countElement.style.borderRadius = "999px";
        countElement.style.padding = canShowCellHelp ? "0.05rem 0.3rem" : "0";
        countElement.style.background = canShowCellHelp ? "#fff" : "transparent";
        countElement.style.color = "inherit";
        countElement.style.cursor = canShowCellHelp ? "help" : "default";

        if (canShowCellHelp) {
          countElement.type = "button";
          countElement.title = "Voir les mots possibles avec cette lettre";

          countElement.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            options.onCellHelpClick?.({
              row,
              col,
              letter,
              event,
            });
          });

          countElement.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            event.stopPropagation();
          });

          countElement.addEventListener("pointerup", (event) => {
            event.preventDefault();
            event.stopPropagation();
          });
        }

        cell.appendChild(countElement);
      }

      if (canClickCells) {
        cell.addEventListener("click", (event) => {
          options.onCellClick?.({
            row,
            col,
            letter,
            event,
          });
        });

        cell.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          cell.setPointerCapture?.(event.pointerId);

          options.onCellPointerDown?.({
            row,
            col,
            letter,
            event,
          });
        });

        cell.addEventListener("pointerenter", (event) => {
          options.onCellPointerEnter?.({
            row,
            col,
            letter,
            event,
          });
        });

        cell.addEventListener("pointerup", (event) => {
          options.onCellPointerUp?.({
            row,
            col,
            letter,
            event,
          });
        });
      }

      boardElement.appendChild(cell);
    }
  }
}
