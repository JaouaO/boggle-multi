let boardInteractionStyleInjected = false;

export function renderBoard(boardElement, board, options = {}) {
  injectBoardInteractionStyle();
  boardElement.innerHTML = "";

  if (!board) {
    return;
  }

  const showCounts = Boolean(options.showCounts);
  const canClickCells = Boolean(options.canClickCells);
  const canShowCellHelp = Boolean(options.canShowCellHelp);
  const selectedKeys = new Set(options.selectedCells || []);

  boardElement.classList.add("boggle-board-grid-runtime");
  boardElement.style.gridTemplateColumns = `repeat(${board[0]?.length || 0}, minmax(48px, 1fr))`;

  if (canClickCells) {
    boardElement.onpointermove = (event) => {
      const cell = getActiveCellFromPointerPosition(boardElement, event);
      updateHoveredCell(boardElement, cell);

      if (!cell) {
        return;
      }

      options.onCellPointerMove?.({
        ...cell,
        event,
      });
    };

    boardElement.onpointerup = (event) => {
      const cell = getActiveCellFromPointerPosition(boardElement, event);

      if (cell) {
        options.onCellPointerUp?.({
          ...cell,
          event,
        });
        return;
      }

      options.onBoardPointerUp?.({ event });
    };

    boardElement.onpointercancel = (event) => {
      updateHoveredCell(boardElement, null);
      options.onCellPointerCancel?.({ event });
    };
  } else {
    updateHoveredCell(boardElement, null);
    boardElement.onpointermove = null;
    boardElement.onpointerup = null;
    boardElement.onpointercancel = null;
  }

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

      cell.classList.add("boggle-board-cell-runtime");
      cell.classList.toggle("boggle-board-cell-clickable", canClickCells);

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
        countElement.classList.add("boggle-board-count-runtime");
        countElement.classList.toggle("boggle-board-count-help-enabled", canShowCellHelp);

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
        cell.addEventListener("mouseenter", () => {
          cell.classList.add("board-cell-hovered");
        });

        cell.addEventListener("mouseleave", () => {
          cell.classList.remove("board-cell-hovered");
        });

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

          if (!isPointerInsideActiveCellArea(cell, event)) {
            return;
          }

          boardElement.setPointerCapture?.(event.pointerId);

          options.onCellPointerDown?.({
            row,
            col,
            letter,
            event,
          });
        });

        cell.addEventListener("pointerenter", (event) => {
          if (!isPointerInsideActiveCellArea(cell, event)) {
            return;
          }

          options.onCellPointerEnter?.({
            row,
            col,
            letter,
            event,
          });
        });

        cell.addEventListener("pointerup", (event) => {
          event.preventDefault();
        });
      }

      boardElement.appendChild(cell);
    }
  }
}



function injectBoardInteractionStyle() {
  boardInteractionStyleInjected = true;
}



function updateHoveredCell(boardElement, nextCell) {
  const nextKey = nextCell ? `${nextCell.row}:${nextCell.col}` : "";

  for (const cell of boardElement.querySelectorAll(".board-cell-hovered")) {
    const key = `${cell.dataset.row}:${cell.dataset.col}`;

    if (key !== nextKey) {
      cell.classList.remove("board-cell-hovered");
    }
  }

  if (!nextCell) {
    return;
  }

  const element = boardElement.querySelector(
    `.board-cell[data-row="${nextCell.row}"][data-col="${nextCell.col}"]`
  );

  if (!element) {
    return;
  }

  element.classList.add("board-cell-hovered");
}


function getActiveCellFromPointerPosition(boardElement, event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const cell = element?.closest?.(".board-cell");

  if (!cell || !boardElement.contains(cell)) {
    return null;
  }

  if (!isPointerInsideActiveCellArea(cell, event)) {
    return null;
  }

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  const letter = cell.dataset.letter || "";

  if (!Number.isInteger(row) || !Number.isInteger(col) || !letter) {
    return null;
  }

  return { row, col, letter };
}

function isPointerInsideActiveCellArea(cell, event) {
  const rect = cell.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    return false;
  }

  const cornerSize = Math.min(rect.width, rect.height) * 0.30;
  const inLeft = x < cornerSize;
  const inRight = x > rect.width - cornerSize;
  const inTop = y < cornerSize;
  const inBottom = y > rect.height - cornerSize;

  return !((inLeft || inRight) && (inTop || inBottom));
}
