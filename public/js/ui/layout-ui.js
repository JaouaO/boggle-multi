let layoutInitialized = false;

/*
 * F9X-DEAD-HELPERS-CLEANUP :
 * suppression des helpers morts confirmés par audit.
 */

/*
 * F9W3-STATIC-LAYOUT-LEGACY-CLEANUP :
 * les anciens titres/sections statiques de public/index.html ont été supprimés.
 * layout-ui.js n'a plus besoin de caches génériques par texte ou section vide.
 */
let layoutSyncing = false;


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

  const observer = new MutationObserver(() => {
    if (!layoutSyncing) {
      syncLayout();
    }
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
  });

  syncLayout();
}


/* F9Z3 : layout sans ancien accueil. */
function syncLayout() {
  if (layoutSyncing) {
    return;
  }

  const shell = document.querySelector("#boggle-shell");

  if (!shell) {
    return;
  }

  layoutSyncing = true;

  try {
    const top = shell.querySelector("#boggle-top");
    const left = shell.querySelector("#boggle-left");
    const center = shell.querySelector("#boggle-center");
    const right = shell.querySelector("#boggle-right");

    if (!top || !left || !center || !right) {
      return;
    }

    ensureBrand(top);


    const launchPanel = ensurePanel(center, "launch-panel", "Lancer une grille");
    // main.js est seul responsable de la visibilité du panneau selon le mode.
    moveNode("#start", launchPanel);
    moveDirect("#mode-controls", launchPanel);

    const statusPanel = ensurePanel(center, "play-status-panel", "Partie");
    moveNode("#game-status", statusPanel);
    moveNode("#timer", statusPanel);
    moveNode("#end-game", statusPanel);

    moveDirect("#board", center);
    moveDirect("#word-form", center);
    moveDirect("#word-feedback", center);
    moveDirect("#mouse-input-panel", center);

    const mouseInputPanel = document.querySelector("#mouse-input-panel");
    if (mouseInputPanel) {
      mouseInputPanel.hidden = true;
    }

    moveDirect("#end-screen", center);

    const playersPanel = ensurePanel(left, "players-panel", "Joueurs");
    moveNode("#players", playersPanel);

    const wordsPanel = ensurePanel(left, "found-words-panel", "Mots trouvés");
    moveNode("#found-words", wordsPanel);

    moveRightColumnContent(right);

    moveTechnicalLog();
  } finally {
    layoutSyncing = false;
  }
}

function moveRightColumnContent(right) {
  ensureMockupRightCards(right);

  const helpSlot = ensureSlot(right, "help-slot", "help-slot");
  helpSlot.hidden = true;

  const helpPanel = document.querySelector("#help-panel");
  if (helpPanel) {
    moveElementInto(helpPanel, helpSlot);
  }

  const rulesSummary = document.querySelector("#rules-summary");
  if (rulesSummary) {
    moveElementInto(rulesSummary, helpSlot);
  }
}


function ensureBrand(parent) {
  let brand = document.querySelector("#boggle-brand");

  if (!brand) {
    brand = document.createElement("div");
    brand.id = "boggle-brand";
    brand.setAttribute("aria-label", "Boggle");

    const mark = document.createElement("span");
    mark.className = "boggle-brand-mark";
    mark.textContent = "Boggle";

    const dots = document.createElement("span");
    dots.className = "boggle-brand-dots";
    dots.setAttribute("aria-hidden", "true");

    for (const className of [
      "brand-dot brand-dot-orange",
      "brand-dot brand-dot-yellow",
      "brand-dot brand-dot-green",
    ]) {
      const dot = document.createElement("span");
      dot.className = className;
      dots.append(dot);
    }

    brand.append(mark, dots);
  }

  if (brand.parentElement !== parent) {
    parent.prepend(brand);
  } else if (parent.firstElementChild !== brand) {
    parent.prepend(brand);
  }

  return brand;
}


function ensureMockupRightCards(parent) {
  let stack = document.querySelector("#mockup-right-cards");

  if (!stack) {
    stack = document.createElement("section");
    stack.id = "mockup-right-cards";
    stack.setAttribute("aria-label", "Aide et règles");

    stack.append(
      createMockupInfoCard({
        id: "mockup-help-card",
        modifier: "help-card rules-card",
        icon: "📜",
        title: "Règles",
        body: "Formez des mots français valides en reliant des lettres adjacentes.",
        items: [
          ["3+", "Mots de 3 lettres minimum"],
          ["↔", "Toutes les lettres doivent être connectées"],
          ["★", "Points : 3-4 = 1 · 5 = 2 · 6 = 3 · 7 = 5 · 8+ = 11"],
        ],
      }),
      createMockupInfoCard({
        id: "mockup-unique-card",
        modifier: "unique-card",
        icon: "✨",
        title: "Mot unique dans la salle",
        body: "Activé : un mot déjà trouvé par un autre joueur ne peut plus être validé.",
      }),
      createMockupInfoCard({
        id: "mockup-penalty-card",
        modifier: "penalty-card",
        icon: "!",
        title: "Pénalité",
        body: "Activée : un mot invalide retire des points.",
      })
    );
  }

  moveElementInto(stack, parent);

  return stack;
}

function createMockupInfoCard({ id, modifier, icon, title, body, items = [] }) {
  const card = document.createElement("section");
  card.id = id;
  card.className = `mockup-info-card ${modifier}`;

  const heading = document.createElement("h2");

  const iconElement = document.createElement("span");
  iconElement.className = "mockup-info-icon";
  iconElement.textContent = icon;

  const titleElement = document.createElement("span");
  titleElement.textContent = title;

  const question = document.createElement("span");
  question.className = "mockup-info-question";
  question.textContent = "?";
  question.setAttribute("aria-hidden", "true");

  heading.append(iconElement, titleElement, question);

  const text = document.createElement("p");
  text.textContent = body;

  card.append(heading, text);

  if (items.length) {
    const list = document.createElement("ul");
    list.className = "mockup-help-list";

    for (const [itemIcon, itemText] of items) {
      const item = document.createElement("li");

      const bullet = document.createElement("span");
      bullet.className = "mockup-help-icon";
      bullet.textContent = itemIcon;

      const label = document.createElement("span");
      label.textContent = itemText;

      item.append(bullet, label);
      list.append(item);
    }

    card.append(list);
  }

  return card;
}


function ensureSlot(parent, id, className) {
  let slot = document.querySelector(`#${id}`);

  if (!slot) {
    slot = document.createElement("section");
    slot.id = id;
    slot.className = className;
  }

  moveElementInto(slot, parent);

  return slot;
}













function moveElementInto(node, parent) {
  if (!node || !parent || node.parentElement === parent) {
    return;
  }

  parent.appendChild(node);
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


