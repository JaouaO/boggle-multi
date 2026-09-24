export function resetHelpPanel(anchorElement) {
  const panel = ensureHelpPanel(anchorElement);

  panel.summary.textContent = "Aide : lancez une partie pour voir les mots possibles.";
  panel.cellTitle.textContent = "Cliquez sur une lettre";
  panel.cellBody.textContent = "Les mots possibles utilisant cette lettre apparaîtront ici.";
}

export function renderHelpSummary(anchorElement, stats, progress = {}) {
  const panel = ensureHelpPanel(anchorElement);
  const foundWords = progress.foundWords ?? 0;
  const foundScore = progress.foundScore ?? 0;

  panel.summary.textContent =
    `${foundWords}/${stats.totalWords} mot(s) trouvés — ` +
    `${foundScore}/${stats.maxScore} point(s) — ` +
    `calcul en ${stats.solveDurationMs} ms.`;
}

export function showCellHelp(anchorElement, { row, col, letter, words, foundWords }) {
  const panel = ensureHelpPanel(anchorElement);
  const foundSet = new Set(foundWords || []);
  const position = `${row + 1}, ${col + 1}`;
  const foundCount = words.filter((word) => foundSet.has(word)).length;

  panel.cellTitle.textContent = `${letter} — case ${position} — ${foundCount}/${words.length} mot(s)`;

  if (words.length === 0) {
    panel.cellBody.textContent = "Aucun mot possible avec cette lettre.";
    return;
  }

  const groups = groupWordsByLength(words);

  panel.cellBody.innerHTML = "";

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
    panel.cellBody.appendChild(section);
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

    const title = document.createElement("h2");
    title.textContent = "Aide";
    title.style.marginTop = "0";

    const summary = document.createElement("p");
    summary.id = "help-summary";

    const cellTitle = document.createElement("h3");
    cellTitle.id = "help-cell-title";
    cellTitle.style.marginBottom = "0.25rem";

    const cellBody = document.createElement("div");
    cellBody.id = "help-cell-body";

    panel.append(title, summary, cellTitle, cellBody);
    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    element: panel,
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
