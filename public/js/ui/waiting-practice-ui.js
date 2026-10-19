// M2 : échauffement local, strictement séparé des scores et du WebSocket.
// Mots possibles pré-calculés à partir de src/engine/generated-dictionary.ts.
import { renderBoard } from "./board-ui.js";
import { normalizeComparableWord } from "../core/player-word-utils.js";
import { WAITING_MESSAGE_GRIDS } from "./waiting-message-data.js";



export function getWaitingPracticeGrids() { return WAITING_MESSAGE_GRIDS; }

export function createWaitingPractice({
  boardElement, wordInput, wordSubmitButton, feedbackElement, timerElement,
  onFoundWordsChange = () => {}, onFeedback = () => {},
}) {
  let active = false;
  let current = WAITING_MESSAGE_GRIDS[0];
  let selected = [];
  let dragPath = [];
  let dragging = false;
  let moved = false;
  let suppressClick = false;
  let found = new Set();
  let valid = new Set(current.words);
  let currentRoom = "";

  const same = (a, b) => a.row === b.row && a.col === b.col;
  const adjacent = (a, b) => Math.abs(a.row-b.row) <= 1 && Math.abs(a.col-b.col) <= 1;
  const asWord = () => selected.map(({letter}) => letter).join("");
  const normalized = (text) => normalizeComparableWord(String(text || "").trim());

  function showMessage(text) {
    feedbackElement.textContent = text;
  }

  // La sélection et les lettres tapées utilisent toutes deux la grille locale.
  // Le chemin sert uniquement aux effets visuels : aucune donnée serveur.
  function getWordPath(word) {
    const rows = current.rows;
    const visit = (row, col, index, path, used) => {
      if (row < 0 || row >= 4 || col < 0 || col >= 4 ||
          used.has(`${row}:${col}`) || rows[row][col] !== word[index]) return null;
      const next = [...path, { row, col }];
      if (index === word.length - 1) return next;
      const visited = new Set(used);
      visited.add(`${row}:${col}`);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const result = visit(row + dr, col + dc, index + 1, next, visited);
          if (result) return result;
        }
      }
      return null;
    };
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const result = visit(row, col, 0, [], new Set());
        if (result) return result;
      }
    }
    return [];
  }

  function addCell(next) {
    if (!active || next.letter === "_") return;
    const previous = selected.at(-1);
    if (!previous) selected = [next];
    else if (same(previous, next)) selected = selected.slice(0, -1);
    else {
      const older = selected.findIndex((existing) => same(existing, next));
      if (older >= 0) selected = selected.slice(0, older + 1);
      else if (adjacent(previous, next)) selected.push(next);
      else selected = [next];
    }
    wordInput.value = asWord();
    render();
  }

  function onClick(next) {
    if (suppressClick) { suppressClick = false; return; }
    addCell(next);
  }
  function onDown(next) {
    if (next.letter === "_") return;
    dragging = true; moved = false; dragPath = [next];
    wordInput.value = next.letter;
    render();
  }
  function onMove(next) {
    if (!dragging || next.letter === "_") return;
    const previous = dragPath.at(-1);
    if (!previous || same(previous, next)) return;
    const older = dragPath.findIndex((existing) => same(existing, next));
    if (older >= 0) {
      dragPath = dragPath.slice(0, older + 1); moved = true;
    } else if (adjacent(previous, next)) {
      dragPath.push(next); moved = true;
    } else return;
    wordInput.value = dragPath.map(({ letter }) => letter).join("");
    render();
  }
  function onUp() {
    if (!dragging) return;
    dragging = false; suppressClick = true;
    if (moved && dragPath.length >= 3) {
      selected = dragPath;
      submit(asWord());
    } else if (dragPath.length) addCell(dragPath[0]);
    else render();
    dragPath = [];
    moved = false;
  }

  function render() {
    if (!active) return;
    const board = current.rows.map((row) => [...row]);
    renderBoard(boardElement, board, {
      canClickCells: true,
      selectedCells: (dragging ? dragPath : selected).map(({row,col}) => `${row}:${col}`),
      onCellClick: onClick,
      onCellPointerDown: onDown,
      onCellPointerMove: onMove,
      onCellPointerEnter: onMove,
      onCellPointerUp: onUp,
      onBoardPointerUp: onUp,
      onCellPointerCancel: onUp,
    });
    for (const spacer of boardElement.querySelectorAll('[data-letter="_"]')) {
      spacer.disabled = true;
      spacer.classList.add("boggle-waiting-spacer-m2");
      spacer.title = "Espace du message";
    }
  }

  function start({roomId,context}) {
    if (!document.body.classList.contains("v87-game-active")) return;
    if (active && currentRoom === roomId) { render(); return; }
    currentRoom = roomId;
    const index = [...String(roomId || context || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0) % WAITING_MESSAGE_GRIDS.length;
    current = WAITING_MESSAGE_GRIDS[index]; valid = new Set(current.words); found = new Set();
    onFoundWordsChange([]);
    selected = []; dragPath = []; dragging = false; moved = false; suppressClick = false;
    active = true;
    wordInput.disabled = false; wordSubmitButton.disabled = false;
    wordInput.value = "";
    timerElement.textContent = "Sans chrono";
    render();
    showMessage(`Échauffement : « ${current.message} ». Sans chrono et sans points.`);
  }

  function stop() {
    if (active) {
      wordInput.value = "";
      onFoundWordsChange([]);
    }
    active = false; currentRoom = ""; selected = []; dragPath = []; dragging = false; moved = false;
    suppressClick = false; found = new Set();
  }

  function submit(rawWord) {
    if (!active) return false;
    const word = normalized(rawWord);
    const path = selected.length && normalized(asWord()) === word
      ? selected.map(({ row, col }) => ({ row, col }))
      : getWordPath(word);
    if (word.length < 3) {
      showMessage("Échauffement : au moins trois lettres.");
      onFeedback({ type: "invalid", label: "!", path });
      return true;
    }
    if (!valid.has(word)) {
      showMessage(`Échauffement : ${word} ne figure pas dans cette grille.`);
      onFeedback({ type: "invalid", label: "!", path });
      return true;
    }
    if (found.has(word)) {
      showMessage(`Échauffement : ${word} déjà trouvé !`);
      onFeedback({ type: "duplicate", label: "!", path });
      return true;
    }
    found.add(word);
    onFoundWordsChange([...found].map((foundWord) => ({ word: foundWord, points: 0 })));
    showMessage(`Échauffement : ${word} trouvé ! ${found.size} mot${found.size > 1 ? "s" : ""} · aucun point officiel.`);
    selected = []; wordInput.value = ""; render();
    onFeedback({ type: "accepted", label: "✓", path });
    return true;
  }

  function onInput() {
    if (!active) return;
    selected = []; dragPath = []; dragging = false;
    render();
  }

  document.addEventListener("pointerup", (event) => {
    if (active && dragging && !event.target?.closest?.("#board .board-cell")) onUp();
  });

  return { isActive: () => active, start, stop, submit, onInput, render };
}
