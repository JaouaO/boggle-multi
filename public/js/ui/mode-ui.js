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

  controls.durationMode.onchange = refreshDurationControls;
  controls.durationSeconds.oninput = () => sanitizeDigitsOnly(controls.durationSeconds);
  controls.durationSeconds.onblur = () => {
    controls.durationSeconds.value = String(
      clampDuration(Number(controls.durationSeconds.value))
    );
  };

  controls.targetScoreMode.onchange = refreshDurationControls;
  controls.targetScorePercent.oninput = () => sanitizeDigitsOnly(controls.targetScorePercent);
  controls.targetScorePercent.onblur = () => {
    controls.targetScorePercent.value = String(
      clampTargetScorePercent(Number(controls.targetScorePercent.value))
    );
  };

  controls.targetScore.oninput = () => sanitizeDigitsOnly(controls.targetScore);
  controls.targetScore.onblur = () => {
    controls.targetScore.value = String(
      clampTargetScore(Number(controls.targetScore.value))
    );
  };

  controls.penalizeInvalidWords.onchange = refreshPenaltyControls;
  controls.invalidWordPenalty.oninput = () => sanitizeDigitsOnly(controls.invalidWordPenalty);
  controls.invalidWordPenalty.onblur = () => {
    controls.invalidWordPenalty.value = String(
      clampPenalty(Number(controls.invalidWordPenalty.value))
    );
  };

  refreshDurationControls();
  refreshPenaltyControls();
}

export function getGameOptions() {
  const panel = document.querySelector("#mode-controls");
  const selectedDurationMode = panel?.querySelector("#duration-mode")?.value;
  const durationMode =
    selectedDurationMode === "noTimer" || selectedDurationMode === "targetScore"
      ? selectedDurationMode
      : "timer";

  const durationInput = panel?.querySelector("#duration-seconds");
  const durationSeconds = clampDuration(Number(durationInput?.value ?? 180));

  if (durationInput) {
    durationInput.value = String(durationSeconds);
  }

  const targetScoreMode =
    panel?.querySelector("#target-score-mode")?.value === "fixedScore"
      ? "fixedScore"
      : "percentOfMaxScore";

  const percentInput = panel?.querySelector("#target-score-percent");
  const targetScorePercent = clampTargetScorePercent(
    Number(percentInput?.value ?? 70)
  );

  if (percentInput) {
    percentInput.value = String(targetScorePercent);
  }

  const targetScoreInput = panel?.querySelector("#target-score");
  const targetScore = clampTargetScore(Number(targetScoreInput?.value ?? 50));

  if (targetScoreInput) {
    targetScoreInput.value = String(targetScore);
  }

  const uniqueWords = Boolean(panel?.querySelector("#unique-words")?.checked);
  const penalizeInvalidWords = Boolean(
    panel?.querySelector("#penalize-invalid-words")?.checked
  );

  const penaltyInput = panel?.querySelector("#invalid-word-penalty");
  const invalidWordPenalty = clampPenalty(Number(penaltyInput?.value ?? 1));

  if (penaltyInput) {
    penaltyInput.value = String(invalidWordPenalty);
  }

  const maxHelpLevel = clampHelpLevel(
    Number(panel?.querySelector("#max-help-level")?.value ?? 3)
  );

  const soundEnabled = Boolean(panel?.querySelector("#sound-enabled")?.checked);
  const visualEffectsEnabled = Boolean(
    panel?.querySelector("#visual-effects-enabled")?.checked
  );

  const volumeInput = panel?.querySelector("#master-volume");
  const masterVolume = clampVolume(Number(volumeInput?.value ?? 65) / 100);

  return {
    durationMode,
    durationSeconds,
    targetScoreMode,
    targetScorePercent,
    targetScore,
    uniqueWords,
    penalizeInvalidWords,
    invalidWordPenalty,
    maxHelpLevel,
    soundEnabled,
    masterVolume,
    visualEffectsEnabled,
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

    const title = document.createElement("h2");
    title.textContent = "Options de partie";
    title.style.marginTop = "0";

    const durationFieldset = createFieldset("Fin de partie");

    const durationModeLabel = createLabeledControl("Mode");
    const durationMode = document.createElement("select");
    durationMode.id = "duration-mode";

    const timedOption = document.createElement("option");
    timedOption.value = "timer";
    timedOption.textContent = "Partie chronométrée";

    const noTimerOption = document.createElement("option");
    noTimerOption.value = "noTimer";
    noTimerOption.textContent = "Sans timer";

    const targetScoreOption = document.createElement("option");
    targetScoreOption.value = "targetScore";
    targetScoreOption.textContent = "Objectif de score";

    durationMode.append(timedOption, noTimerOption, targetScoreOption);
    durationModeLabel.append(durationMode);

    const durationSecondsLabel = createLabeledControl("Durée en secondes");
    durationSecondsLabel.id = "duration-seconds-label";

    const durationSeconds = document.createElement("input");
    durationSeconds.id = "duration-seconds";
    durationSeconds.type = "text";
    durationSeconds.inputMode = "numeric";
    durationSeconds.pattern = "[0-9]*";
    durationSeconds.value = "180";
    durationSeconds.autocomplete = "off";

    durationSecondsLabel.append(durationSeconds);

    const targetScoreModeLabel = createLabeledControl("Objectif");
    targetScoreModeLabel.id = "target-score-mode-label";

    const targetScoreMode = document.createElement("select");
    targetScoreMode.id = "target-score-mode";

    const percentOption = document.createElement("option");
    percentOption.value = "percentOfMaxScore";
    percentOption.textContent = "Pourcentage du score max";

    const fixedOption = document.createElement("option");
    fixedOption.value = "fixedScore";
    fixedOption.textContent = "Score fixe";

    targetScoreMode.append(percentOption, fixedOption);
    targetScoreModeLabel.append(targetScoreMode);

    const targetScorePercentLabel = createLabeledControl("Pourcentage");
    targetScorePercentLabel.id = "target-score-percent-label";

    const targetScorePercent = document.createElement("input");
    targetScorePercent.id = "target-score-percent";
    targetScorePercent.type = "text";
    targetScorePercent.inputMode = "numeric";
    targetScorePercent.pattern = "[0-9]*";
    targetScorePercent.value = "70";
    targetScorePercent.autocomplete = "off";

    targetScorePercentLabel.append(targetScorePercent);

    const targetScoreLabel = createLabeledControl("Score cible");
    targetScoreLabel.id = "target-score-label";

    const targetScore = document.createElement("input");
    targetScore.id = "target-score";
    targetScore.type = "text";
    targetScore.inputMode = "numeric";
    targetScore.pattern = "[0-9]*";
    targetScore.value = "50";
    targetScore.autocomplete = "off";

    targetScoreLabel.append(targetScore);

    durationFieldset.append(
      durationModeLabel,
      durationSecondsLabel,
      targetScoreModeLabel,
      targetScorePercentLabel,
      targetScoreLabel
    );

    const rulesFieldset = createFieldset("Règles");

    const uniqueWordsLabel = createCheckboxLabel(
      "unique-words",
      "Mots uniques dans la salle",
      "Un mot validé par un joueur ne peut plus être validé par les autres."
    );

    const penalizeInvalidWordsLabel = createCheckboxLabel(
      "penalize-invalid-words",
      "Pénalité sur erreur",
      "Un mot invalide fait perdre des points. Un même joueur n’est pénalisé qu’une seule fois par mot faux."
    );

    const invalidWordPenaltyLabel = createLabeledControl("Pénalité");
    invalidWordPenaltyLabel.id = "invalid-word-penalty-label";

    const invalidWordPenalty = document.createElement("input");
    invalidWordPenalty.id = "invalid-word-penalty";
    invalidWordPenalty.type = "text";
    invalidWordPenalty.inputMode = "numeric";
    invalidWordPenalty.pattern = "[0-9]*";
    invalidWordPenalty.value = "1";
    invalidWordPenalty.autocomplete = "off";

    invalidWordPenaltyLabel.append(invalidWordPenalty);

    const maxHelpLevelLabel = createLabeledControl("Aide maximale pendant la partie");
    const maxHelpLevel = document.createElement("select");
    maxHelpLevel.id = "max-help-level";

    const helpOptions = [
      ["0", "Aucune aide"],
      ["1", "Compteurs seulement"],
      ["2", "Aide par lettre"],
      ["3", "Solution complète"],
    ];

    for (const [value, label] of helpOptions) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      maxHelpLevel.append(option);
    }

    maxHelpLevel.value = "3";
    maxHelpLevelLabel.append(maxHelpLevel);

    rulesFieldset.append(
      uniqueWordsLabel,
      penalizeInvalidWordsLabel,
      invalidWordPenaltyLabel,
      maxHelpLevelLabel
    );

    const feedbackFieldset = createFieldset("Feedback");

    const soundEnabledLabel = createCheckboxLabel(
      "sound-enabled",
      "Sons activés",
      "Joue un petit son pour les mots acceptés, refusés ou déjà trouvés."
    );
    soundEnabledLabel.querySelector("input").checked = true;

    const masterVolumeLabel = createLabeledControl("Volume master");
    masterVolumeLabel.id = "master-volume-label";

    const masterVolume = document.createElement("input");
    masterVolume.id = "master-volume";
    masterVolume.type = "range";
    masterVolume.min = "0";
    masterVolume.max = "100";
    masterVolume.step = "5";
    masterVolume.value = "65";

    masterVolumeLabel.append(masterVolume);

    const visualEffectsEnabledLabel = createCheckboxLabel(
      "visual-effects-enabled",
      "Effets visuels",
      "Affiche un signal discret autour de la saisie quand un mot est accepté ou refusé."
    );
    visualEffectsEnabledLabel.querySelector("input").checked = true;

    feedbackFieldset.append(
      soundEnabledLabel,
      masterVolumeLabel,
      visualEffectsEnabledLabel
    );

    const boardFieldset = createFieldset("Grille personnalisée");

    const description = document.createElement("p");
    description.textContent =
      "Collez une grille analogique pour vérifier les mots sans timer.";

    const textarea = document.createElement("textarea");
    textarea.id = "custom-board";
    textarea.rows = 5;
    textarea.placeholder = "ABCD\nEFGH\nIJKL\nMNOP";

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
    feedback.style.color = "#a9433f";

    actions.append(solutionButton, fillExampleButton);
    boardFieldset.append(description, textarea, actions, feedback);

    const later = document.createElement("details");
    later.id = "future-game-options";
    later.style.marginTop = "1rem";

    const laterSummary = document.createElement("summary");
    laterSummary.textContent = "Options à venir";

    const laterText = document.createElement("p");
    laterText.textContent =
      "Sons, volume, effets visuels et musique seront branchés dans les prochaines étapes.";

    later.append(laterSummary, laterText);

    panel.append(
      title,
      durationFieldset,
      rulesFieldset,
      feedbackFieldset,
      boardFieldset,
      later
    );

    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    panel,
    durationMode: panel.querySelector("#duration-mode"),
    durationSeconds: panel.querySelector("#duration-seconds"),
    durationSecondsLabel: panel.querySelector("#duration-seconds-label"),
    targetScoreMode: panel.querySelector("#target-score-mode"),
    targetScoreModeLabel: panel.querySelector("#target-score-mode-label"),
    targetScorePercent: panel.querySelector("#target-score-percent"),
    targetScorePercentLabel: panel.querySelector("#target-score-percent-label"),
    targetScore: panel.querySelector("#target-score"),
    targetScoreLabel: panel.querySelector("#target-score-label"),
    uniqueWords: panel.querySelector("#unique-words"),
    penalizeInvalidWords: panel.querySelector("#penalize-invalid-words"),
    invalidWordPenalty: panel.querySelector("#invalid-word-penalty"),
    invalidWordPenaltyLabel: panel.querySelector("#invalid-word-penalty-label"),
    maxHelpLevel: panel.querySelector("#max-help-level"),
    soundEnabled: panel.querySelector("#sound-enabled"),
    masterVolume: panel.querySelector("#master-volume"),
    visualEffectsEnabled: panel.querySelector("#visual-effects-enabled"),
    textarea: panel.querySelector("#custom-board"),
    solutionButton: panel.querySelector("#start-solution-mode"),
    fillExampleButton: panel.querySelector("#fill-example-board"),
    feedback: panel.querySelector("#mode-feedback"),
  };
}

function createFieldset(title) {
  const fieldset = document.createElement("fieldset");
  fieldset.style.border = "0";
  fieldset.style.padding = "0";
  fieldset.style.margin = "0 0 1rem";

  const legend = document.createElement("legend");
  legend.textContent = title;
  legend.style.fontWeight = "800";
  legend.style.marginBottom = "0.5rem";

  fieldset.append(legend);

  return fieldset;
}

function createLabeledControl(labelText) {
  const label = document.createElement("label");

  const text = document.createElement("span");
  text.textContent = labelText;

  label.append(text);

  return label;
}

function createCheckboxLabel(id, labelText, descriptionText) {
  const label = document.createElement("label");
  label.style.display = "grid";
  label.style.gridTemplateColumns = "auto 1fr";
  label.style.gap = "0.45rem";
  label.style.alignItems = "start";
  label.style.margin = "0.5rem 0";

  const input = document.createElement("input");
  input.id = id;
  input.type = "checkbox";
  input.style.marginTop = "0.15rem";

  const body = document.createElement("span");

  const title = document.createElement("strong");
  title.textContent = labelText;

  const description = document.createElement("small");
  description.textContent = descriptionText;
  description.style.display = "block";
  description.style.opacity = "0.75";
  description.style.fontWeight = "400";

  body.append(title, description);
  label.append(input, body);

  return label;
}

function refreshDurationControls() {
  const panel = document.querySelector("#mode-controls");

  if (!panel) {
    return;
  }

  const durationMode = panel.querySelector("#duration-mode");
  const durationSeconds = panel.querySelector("#duration-seconds");
  const durationSecondsLabel = panel.querySelector("#duration-seconds-label");
  const targetScoreMode = panel.querySelector("#target-score-mode");
  const targetScoreModeLabel = panel.querySelector("#target-score-mode-label");
  const targetScorePercent = panel.querySelector("#target-score-percent");
  const targetScorePercentLabel = panel.querySelector("#target-score-percent-label");
  const targetScore = panel.querySelector("#target-score");
  const targetScoreLabel = panel.querySelector("#target-score-label");

  const mode = durationMode?.value ?? "timer";
  const isTimer = mode === "timer";
  const isTargetScore = mode === "targetScore";
  const isFixedTarget = targetScoreMode?.value === "fixedScore";

  if (durationSeconds) {
    durationSeconds.disabled = !isTimer;
  }

  if (durationSecondsLabel) {
    durationSecondsLabel.style.display = isTimer ? "" : "none";
  }

  if (targetScoreModeLabel) {
    targetScoreModeLabel.style.display = isTargetScore ? "" : "none";
  }

  if (targetScorePercentLabel) {
    targetScorePercentLabel.style.display =
      isTargetScore && !isFixedTarget ? "" : "none";
  }

  if (targetScoreLabel) {
    targetScoreLabel.style.display =
      isTargetScore && isFixedTarget ? "" : "none";
  }

  if (targetScorePercent) {
    targetScorePercent.disabled = !isTargetScore || isFixedTarget;
  }

  if (targetScore) {
    targetScore.disabled = !isTargetScore || !isFixedTarget;
  }
}

function refreshPenaltyControls() {
  const panel = document.querySelector("#mode-controls");

  if (!panel) {
    return;
  }

  const penalizeInvalidWords = panel.querySelector("#penalize-invalid-words");
  const invalidWordPenalty = panel.querySelector("#invalid-word-penalty");
  const invalidWordPenaltyLabel = panel.querySelector("#invalid-word-penalty-label");
  const enabled = Boolean(penalizeInvalidWords?.checked);

  if (invalidWordPenalty) {
    invalidWordPenalty.disabled = !enabled;
  }

  if (invalidWordPenaltyLabel) {
    invalidWordPenaltyLabel.style.opacity = enabled ? "1" : "0.45";
  }
}

function sanitizeDigitsOnly(input) {
  if (!input) {
    return;
  }

  input.value = input.value.replace(/\D+/g, "");
}

function clampDuration(value) {
  if (!Number.isFinite(value)) {
    return 15;
  }

  return Math.min(3600, Math.max(15, Math.round(value)));
}

function clampPenalty(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}

function clampHelpLevel(value) {
  if (!Number.isFinite(value)) {
    return 3;
  }

  return Math.min(3, Math.max(0, Math.round(value)));
}

function clampTargetScorePercent(value) {
  if (!Number.isFinite(value)) {
    return 70;
  }

  return Math.min(100, Math.max(1, Math.round(value)));
}

function clampTargetScore(value) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(9999, Math.max(1, Math.round(value)));
}

function clampVolume(value) {
  if (!Number.isFinite(value)) {
    return 0.65;
  }

  return Math.min(1, Math.max(0, value));
}
