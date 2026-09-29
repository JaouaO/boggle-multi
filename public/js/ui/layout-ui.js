let layoutInitialized = false;

const HIDDEN_OLD_HEADINGS = new Set([
  "grille",
  "proposer un mot",
  "mots trouvés",
  "joueurs",
  "journal",
]);

export function setupAppLayout() {
  if (layoutInitialized) {
    return;
  }

  layoutInitialized = true;

  const root =
    document.querySelector("main") ||
    document.querySelector("#app") ||
    document.body;

  const shell = document.createElement("section");
  shell.id = "boggle-shell";
  shell.setAttribute("aria-label", "Interface de jeu");

  const top = document.createElement("section");
  top.id = "boggle-top";
  top.className = "boggle-zone";

  const layout = document.createElement("section");
  layout.id = "boggle-layout";
  layout.setAttribute("aria-label", "Plateau de jeu");

  const left = document.createElement("aside");
  left.id = "boggle-left";
  left.className = "boggle-column";
  left.setAttribute("aria-label", "Joueurs et mots trouvés");

  const center = document.createElement("section");
  center.id = "boggle-center";
  center.className = "boggle-column";
  center.setAttribute("aria-label", "Grille et saisie");

  const right = document.createElement("aside");
  right.id = "boggle-right";
  right.className = "boggle-column";
  right.setAttribute("aria-label", "Aide");

  layout.append(left, center, right);
  shell.append(top, layout);
  root.appendChild(shell);

  const observer = new MutationObserver(syncLayout);
  observer.observe(root, {
    childList: true,
    subtree: true,
  });

  syncLayout();
}

function syncLayout() {
  const shell = document.querySelector("#boggle-shell");

  if (!shell) {
    return;
  }

  const top = shell.querySelector("#boggle-top");
  const left = shell.querySelector("#boggle-left");
  const center = shell.querySelector("#boggle-center");
  const right = shell.querySelector("#boggle-right");

  moveConnectionControls(top);

  const launchPanel = ensurePanel(center, "launch-panel", "Lancer une grille");
  launchPanel.hidden = isGridActive();
  moveNode("#start", launchPanel);
  moveDirect("#mode-controls", launchPanel);

  const statusPanel = ensurePanel(center, "play-status-panel", "Partie");
  moveNode("#game-status", statusPanel);
  moveNode("#timer", statusPanel);

  moveDirect("#board", center);
  moveDirect("#word-form", center);
  moveDirect("#word-feedback", center);
  moveDirect("#mouse-input-panel", center);
  moveDirect("#end-screen", center);

  const playersPanel = ensurePanel(left, "players-panel", "Joueurs");
  moveNode("#players", playersPanel);

  const wordsPanel = ensurePanel(left, "found-words-panel", "Mots trouvés");
  moveNode("#found-words", wordsPanel);

  moveDirect("#help-panel", right);

  moveTechnicalLog();
  hideOldStructuralHeadings();
  hideEmptyLegacyContainers();
}

function isGridActive() {
  const statusText = document
    .querySelector("#game-status")
    ?.textContent
    ?.trim()
    ?.toLowerCase() ?? "";

  return statusText.includes("partie en cours") || statusText.includes("mode solution");
}

function moveConnectionControls(top) {
  moveNearestLabeledControl("#room", top);
  moveNearestLabeledControl("#name", top);
  moveNode("#connect", top);
  moveNode("#status", top);
}

function moveNearestLabeledControl(selector, parent) {
  const input = document.querySelector(selector);

  if (!input) {
    return;
  }

  const label = input.closest("label");

  if (label) {
    if (label.parentElement !== parent) {
      parent.appendChild(label);
    }

    return;
  }

  moveNode(selector, parent);
}

function ensurePanel(parent, id, title) {
  let panel = document.querySelector(`#${id}`);

  if (!panel) {
    panel = document.createElement("section");
    panel.id = id;
    panel.className = "layout-panel";

    const heading = document.createElement("h2");
    heading.textContent = title;

    panel.appendChild(heading);
    parent.appendChild(panel);
  }

  if (panel.parentElement !== parent) {
    parent.appendChild(panel);
  }

  return panel;
}

function moveDirect(selector, parent) {
  const node = document.querySelector(selector);

  if (!node) {
    return;
  }

  if (node.parentElement !== parent) {
    parent.appendChild(node);
  }
}

function moveNode(selector, parent) {
  const node = document.querySelector(selector);

  if (!node) {
    return;
  }

  if (node.parentElement !== parent) {
    parent.appendChild(node);
  }
}

function moveTechnicalLog() {
  const log = document.querySelector("#log");

  if (!log) {
    return;
  }

  let technicalPanel = document.querySelector("#technical-log-panel");

  if (!technicalPanel) {
    technicalPanel = document.createElement("details");
    technicalPanel.id = "technical-log-panel";
    technicalPanel.hidden = true;

    const summary = document.createElement("summary");
    summary.textContent = "Journal technique";

    technicalPanel.appendChild(summary);
    document.body.appendChild(technicalPanel);
  }

  if (log.parentElement !== technicalPanel) {
    technicalPanel.appendChild(log);
  }
}

function hideOldStructuralHeadings() {
  for (const heading of document.querySelectorAll("h2, h3")) {
    if (heading.closest("#boggle-shell")) {
      continue;
    }

    const normalizedText = heading.textContent.trim().toLowerCase();

    if (HIDDEN_OLD_HEADINGS.has(normalizedText)) {
      heading.hidden = true;
      heading.setAttribute("aria-hidden", "true");
    }
  }
}

function hideEmptyLegacyContainers() {
  for (const section of document.querySelectorAll("section")) {
    if (section.closest("#boggle-shell")) {
      continue;
    }

    if (section.id === "boggle-shell") {
      continue;
    }

    const clone = section.cloneNode(true);

    for (const hiddenNode of clone.querySelectorAll("[hidden], [aria-hidden='true']")) {
      hiddenNode.remove();
    }

    const visibleText = clone.textContent.replace(/\s+/g, "").trim();
    const visibleControls = section.querySelector(
      "input:not([hidden]), textarea:not([hidden]), button:not([hidden]), #board, #players, #found-words, #log"
    );

    if (!visibleText && !visibleControls) {
      section.hidden = true;
    }
  }
}
