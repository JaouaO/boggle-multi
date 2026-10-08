export function renderMouseInputPanel(anchorElement, options) {
  const panel = ensureMouseInputPanel(anchorElement);

  panel.word.textContent = options.word || "—";
  panel.submitButton.disabled = !options.word || options.word.length < 3;
  panel.clearButton.disabled = !options.word;

  panel.submitButton.onclick = () => options.onSubmit?.();
  panel.clearButton.onclick = () => options.onClear?.();
}

function ensureMouseInputPanel(anchorElement) {
  let panel = document.querySelector("#mouse-input-panel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "mouse-input-panel";
    panel.style.marginTop = "0.75rem";
    panel.style.padding = "0.75rem";
    panel.style.border = "1px solid #ddd";
    panel.style.borderRadius = "0.75rem";
    panel.style.background = "#fff";

    const label = document.createElement("p");
    label.textContent = "Sélection souris";
    label.style.fontWeight = "700";
    label.style.margin = "0 0 0.35rem";

    const word = document.createElement("div");
    word.id = "mouse-selected-word";
    word.style.fontSize = "1.4rem";
    word.style.fontWeight = "800";
    word.style.letterSpacing = "0.08em";
    word.textContent = "—";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "0.5rem";
    actions.style.flexWrap = "wrap";
    actions.style.marginTop = "0.75rem";

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.textContent = "Valider la sélection";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Effacer";

    const hint = document.createElement("p");
    hint.style.margin = "0.5rem 0 0";
    hint.style.fontSize = "0.9rem";
    hint.style.opacity = "0.75";
    hint.textContent =
      "Cliquez lettre par lettre, ou maintenez le clic et glissez sur les lettres adjacentes.";

    actions.append(submitButton, clearButton);
    panel.append(label, word, actions, hint);

    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    element: panel,
    word: panel.querySelector("#mouse-selected-word"),
    submitButton: panel.querySelectorAll("button")[0],
    clearButton: panel.querySelectorAll("button")[1],
  };
}
