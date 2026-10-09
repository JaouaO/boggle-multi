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
    panel.classList.add("boggle-mouse-input-panel-inner");

    const label = document.createElement("p");
    label.textContent = "Sélection souris";
    label.classList.add("boggle-mouse-input-label");

    const word = document.createElement("div");
    word.id = "mouse-selected-word";
    word.classList.add("boggle-mouse-selected-word");
    word.textContent = "—";

    const actions = document.createElement("div");
    actions.classList.add("boggle-mouse-input-actions");

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.textContent = "Valider la sélection";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Effacer";

    const hint = document.createElement("p");
    hint.classList.add("boggle-mouse-input-hint");
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
