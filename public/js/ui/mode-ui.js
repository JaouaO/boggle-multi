export function renderModeControls(anchorElement, options) {
  const controls = ensureModeControls(anchorElement);

  controls.panel.hidden = options.visible === false;

  if (options.visible === false) {
    return;
  }

  controls.solutionButton.disabled = Boolean(options.disabled);

  controls.solutionButton.onclick = () => {
    const board = parseCustomBoard(controls.textarea.value);

    if (!board) {
      controls.feedback.textContent =
        "Grille invalide : utilisez 3, 4 ou 5 lignes de même longueur.";
      return;
    }

    controls.feedback.textContent = "";
    options.onStartSolution?.(board);
  };

  controls.fillExampleButton.onclick = () => {
    controls.textarea.value = "ABCD\nEFGH\nIJKL\nMNOP";
    controls.feedback.textContent = "";
  };
}

export function parseCustomBoard(value) {
  const lines = value
    .trim()
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, "").toUpperCase())
    .filter(Boolean);

  if (lines.length < 3 || lines.length > 5) {
    return null;
  }

  const size = lines.length;

  if (!lines.every((line) => line.length === size)) {
    return null;
  }

  return lines.map((line) => [...line]);
}

function ensureModeControls(anchorElement) {
  let panel = document.querySelector("#mode-controls");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "mode-controls";
    panel.style.marginTop = "1rem";
    panel.style.padding = "1rem";
    panel.style.border = "1px solid #ddd";
    panel.style.borderRadius = "0.75rem";
    panel.style.background = "#fff";

    const title = document.createElement("h2");
    title.textContent = "Modes de jeu";
    title.style.marginTop = "0";

    const description = document.createElement("p");
    description.textContent =
      "Lancez une partie chronométrée avec une grille aléatoire, ou collez une grille analogique pour vérifier les mots sans timer.";

    const label = document.createElement("label");
    label.textContent = "Grille personnalisée";
    label.style.display = "block";
    label.style.fontWeight = "700";
    label.style.marginBottom = "0.35rem";

    const textarea = document.createElement("textarea");
    textarea.id = "custom-board";
    textarea.rows = 5;
    textarea.placeholder = "ABCD\nEFGH\nIJKL\nMNOP";
    textarea.style.width = "100%";
    textarea.style.maxWidth = "22rem";
    textarea.style.fontFamily = "monospace";
    textarea.style.letterSpacing = "0.12em";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "0.5rem";
    actions.style.flexWrap = "wrap";
    actions.style.marginTop = "0.75rem";

    const solutionButton = document.createElement("button");
    solutionButton.id = "start-solution-mode";
    solutionButton.type = "button";
    solutionButton.textContent = "Mode solution avec cette grille";

    const fillExampleButton = document.createElement("button");
    fillExampleButton.id = "fill-example-board";
    fillExampleButton.type = "button";
    fillExampleButton.textContent = "Exemple 4×4";

    const feedback = document.createElement("p");
    feedback.id = "mode-feedback";
    feedback.style.marginBottom = "0";
    feedback.style.color = "#dc2626";

    actions.append(solutionButton, fillExampleButton);
    panel.append(title, description, label, textarea, actions, feedback);

    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    panel,
    textarea: panel.querySelector("#custom-board"),
    solutionButton: panel.querySelector("#start-solution-mode"),
    fillExampleButton: panel.querySelector("#fill-example-board"),
    feedback: panel.querySelector("#mode-feedback"),
  };
}
