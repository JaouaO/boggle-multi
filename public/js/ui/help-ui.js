export const HELP_LEVELS = [
  {
    label: "Aucune",
    description: "Aucune indication n’est affichée.",
  },
  {
    label: "Compteurs",
    description: "Affiche le nombre de mots trouvés / possibles sur chaque lettre.",
  },
  {
    label: "Par lettre",
    description: "Permet de cliquer sur une lettre pour afficher les mots qui l’utilisent.",
  },
  {
    label: "Solution",
    description: "Affiche toute la solution de la grille.",
  },
];

export function getNextHelpLevel(currentLevel) {
  return (currentLevel + 1) % HELP_LEVELS.length;
}

export function renderHelpPanel(anchorElement, options) {
  const {
    helpLevel,
    stats,
    progress,
    selectedCell,
    foundWords,
    onHelpLevelChange,
  } = options;

  const panel = ensureHelpPanel(anchorElement);
  const safeLevel = HELP_LEVELS[helpLevel] ? helpLevel : 0;
  const level = HELP_LEVELS[safeLevel];

  panel.levelButton.textContent = `Niveau d’aide : ${level.label}`;
  panel.levelDescription.textContent = level.description;
  panel.levelButton.onclick = () => onHelpLevelChange?.();

  if (safeLevel === 0) {
    panel.summary.textContent = "Aide désactivée.";
    panel.cellTitle.textContent = "";
    panel.cellBody.textContent = "";
    return;
  }

  if (!stats) {
    panel.summary.textContent = "Aide : lancez une partie pour voir les mots possibles.";
    panel.cellTitle.textContent = "";
    panel.cellBody.textContent = "";
    return;
  }

  const foundWordsCount = progress?.foundWords ?? 0;
  const foundScore = progress?.foundScore ?? 0;

  panel.summary.textContent =
    `${foundWordsCount}/${stats.totalWords} mot(s) trouvés — ` +
    `${foundScore}/${stats.maxScore} point(s) — ` +
    `calcul en ${stats.solveDurationMs} ms.`;

  if (safeLevel === 1) {
    panel.cellTitle.textContent = "Compteurs affichés sur la grille";
    panel.cellBody.textContent =
      "Chaque case indique le nombre de mots trouvés / le nombre de mots possibles qui utilisent cette lettre.";
    return;
  }

  if (safeLevel === 3) {
    renderFullSolution(panel, stats, foundWords);
    return;
  }

  if (selectedCell) {
    renderCellWords(panel, selectedCell, foundWords);
    return;
  }

  panel.cellTitle.textContent = "Cliquez sur une lettre";
  panel.cellBody.textContent =
    "Les mots possibles utilisant cette lettre apparaîtront ici.";
}

function renderCellWords(panel, selectedCell, foundWords) {
  const { row, col, letter, words } = selectedCell;
  const foundSet = new Set(foundWords || []);
  const position = `${row + 1}, ${col + 1}`;
  const foundCount = words.filter((word) => foundSet.has(word)).length;

  panel.cellTitle.textContent =
    `${letter} — case ${position} — ${foundCount}/${words.length} mot(s)`;

  if (words.length === 0) {
    panel.cellBody.textContent = "Aucun mot possible avec cette lettre.";
    return;
  }

  renderGroupedWords(panel.cellBody, words, foundSet, {
    onlyRemaining: false,
  });
}

function renderFullSolution(panel, stats, foundWords) {
  const foundSet = new Set(foundWords || []);
  const allWords = getAllWordsFromCellWords(stats.cellWords || []);
  const remainingWords = allWords.filter((word) => !foundSet.has(word));

  panel.cellTitle.textContent =
    `Solution complète — ${remainingWords.length} mot(s) restant(s)`;

  if (allWords.length === 0) {
    panel.cellBody.textContent = "Aucune solution disponible.";
    return;
  }

  renderGroupedWords(panel.cellBody, allWords, foundSet, {
    onlyRemaining: false,
  });
}

function renderGroupedWords(container, words, foundSet, options = {}) {
  const visibleWords = options.onlyRemaining
    ? words.filter((word) => !foundSet.has(word))
    : words;

  const groups = groupWordsByLength(visibleWords);

  container.innerHTML = "";

  for (const [length, groupWords] of groups) {
    const section = document.createElement("div");
    section.style.marginTop = "0.75rem";

    const title = document.createElement("strong");
    title.textContent = `${length} lettres (${groupWords.length})`;

    const list = document.createElement("p");
    list.style.margin = "0.25rem 0 0";
    list.style.lineHeight = "1.5";
    list.textContent = groupWords
      .map((word) => foundSet.has(word) ? `✓ ${word}` : word)
      .join(", ");

    section.append(title, list);
    container.appendChild(section);
  }
}

function ensureHelpPanel(anchorElement) {
  let panel = document.querySelector("#help-panel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "help-panel";
    panel.style.marginTop = "1rem";
    panel.style.padding = "1rem";
    panel.style.border = "1px solid #ddd";
    panel.style.borderRadius = "0.75rem";
    panel.style.background = "#fff";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "1rem";

    const title = document.createElement("h2");
    title.textContent = "Aide";
    title.style.margin = "0";

    const levelButton = document.createElement("button");
    levelButton.id = "help-level-button";
    levelButton.type = "button";

    header.append(title, levelButton);

    const levelDescription = document.createElement("p");
    levelDescription.id = "help-level-description";
    levelDescription.style.margin = "0.5rem 0";
    levelDescription.style.opacity = "0.8";

    const summary = document.createElement("p");
    summary.id = "help-summary";

    const cellTitle = document.createElement("h3");
    cellTitle.id = "help-cell-title";
    cellTitle.style.marginBottom = "0.25rem";

    const cellBody = document.createElement("div");
    cellBody.id = "help-cell-body";

    panel.append(header, levelDescription, summary, cellTitle, cellBody);
    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    element: panel,
    levelButton: panel.querySelector("#help-level-button"),
    levelDescription: panel.querySelector("#help-level-description"),
    summary: panel.querySelector("#help-summary"),
    cellTitle: panel.querySelector("#help-cell-title"),
    cellBody: panel.querySelector("#help-cell-body"),
  };
}

function groupWordsByLength(words) {
  const groupsByLength = new Map();

  for (const word of words) {
    const length = word.length;

    if (!groupsByLength.has(length)) {
      groupsByLength.set(length, []);
    }

    groupsByLength.get(length).push(word);
  }

  return [...groupsByLength.entries()].sort(([a], [b]) => a - b);
}

function getAllWordsFromCellWords(cellWords) {
  const words = new Set();

  for (const row of cellWords) {
    for (const cell of row) {
      for (const word of cell) {
        words.add(word);
      }
    }
  }

  return [...words].sort(sortWords);
}

function sortWords(a, b) {
  if (a.length !== b.length) {
    return a.length - b.length;
  }

  return a.localeCompare(b, "fr");
}
