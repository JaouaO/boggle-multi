let audioContext = null;
let feedbackStyleInjected = false;
let feedbackTimeout = null;

export function runSubmissionFeedback(anchorElement, feedback) {
  const type = normalizeType(feedback.type);
  const label = feedback.label ?? "";
  const options = feedback.options ?? {};

  if (options.soundEnabled !== false) {
    playSound(type, options.masterVolume ?? 0.65);
  }

  if (options.visualEffectsEnabled !== false) {
    showVisualFeedback(anchorElement, type, label);
    showBoardFeedback(feedback.boardElement, feedback.path, type);
  }
}

function normalizeType(type) {
  if (type === "accepted" || type === "invalid" || type === "duplicate") {
    return type;
  }

  return "duplicate";
}

function showVisualFeedback(anchorElement, type, label) {
  injectFeedbackStyle();

  const feedbackElement = document.querySelector("#word-feedback");

  if (!feedbackElement) {
    return;
  }

  feedbackElement.classList.remove(
    "boggle-word-feedback-accepted",
    "boggle-word-feedback-invalid",
    "boggle-word-feedback-duplicate"
  );

  feedbackElement.classList.add("boggle-word-feedback", `boggle-word-feedback-${type}`);

  window.clearTimeout(feedbackTimeout);

  feedbackTimeout = window.setTimeout(() => {
    feedbackElement.classList.remove(
      "boggle-word-feedback-accepted",
      "boggle-word-feedback-invalid",
      "boggle-word-feedback-duplicate"
    );
  }, 1400);
}

function showBoardFeedback(boardElement, path, type) {
  if (!boardElement || !Array.isArray(path) || path.length === 0) {
    return;
  }

  injectFeedbackStyle();

  const previousFeedbackCells = boardElement.querySelectorAll(
    ".board-cell-feedback-accepted, .board-cell-feedback-invalid, .board-cell-feedback-duplicate"
  );

  for (const element of previousFeedbackCells) {
    element.classList.remove(
      "board-cell-feedback-accepted",
      "board-cell-feedback-invalid",
      "board-cell-feedback-duplicate"
    );
  }

  const highlightedCells = [];

  for (const cell of path) {
    const element = boardElement.querySelector(
      `.board-cell[data-row="${cell.row}"][data-col="${cell.col}"]`
    );

    if (!element) {
      continue;
    }

    element.classList.add(`board-cell-feedback-${type}`);
    highlightedCells.push(element);
  }

  window.setTimeout(() => {
    for (const element of highlightedCells) {
      element.classList.remove(
        "board-cell-feedback-accepted",
        "board-cell-feedback-invalid",
        "board-cell-feedback-duplicate"
      );
    }
  }, 575);
}

function playSound(type, masterVolume) {
  const volume = clampVolume(masterVolume);

  if (volume <= 0) {
    return;
  }

  try {
    const ctx = getAudioContext();

    if (!ctx) {
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime + 0.01;

    if (type === "accepted") {
      playTone(ctx, now, 523.25, 0.055, volume * 0.20);
      playTone(ctx, now + 0.065, 659.25, 0.07, volume * 0.22);
      playTone(ctx, now + 0.14, 783.99, 0.08, volume * 0.18);
      return;
    }

    if (type === "invalid") {
      playTone(ctx, now, 196.0, 0.11, volume * 0.24, "sawtooth");
      playTone(ctx, now + 0.09, 155.56, 0.12, volume * 0.20, "sawtooth");
      return;
    }

    playTone(ctx, now, 392.0, 0.055, volume * 0.15);
    playTone(ctx, now + 0.06, 349.23, 0.07, volume * 0.13);
  } catch {
    // Les sons sont un confort : on ignore les blocages navigateur.
  }
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  audioContext = new AudioContextClass();
  return audioContext;
}

function playTone(ctx, startAt, frequency, duration, gainValue, type = "sine") {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function clampVolume(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0.65;
  }

  return Math.min(1, Math.max(0, number));
}

function injectFeedbackStyle() {
  if (feedbackStyleInjected) {
    return;
  }

  feedbackStyleInjected = true;
}

