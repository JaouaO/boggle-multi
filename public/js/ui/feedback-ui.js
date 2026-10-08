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

  const style = document.createElement("style");
  style.id = "boggle-submission-feedback-v25-style";
  style.textContent = `
    /*
     * V25 : effets de résultat propres.
     * Pas de badge flottant sur le formulaire, pas d'outline carré, pas de chemin.
     * Les sons restent inchangés.
     */

    #word-feedback.boggle-word-feedback {
      display: block !important;
      width: min(100%, 49rem) !important;
      margin: 0.42rem auto 0 !important;
      min-height: 2.25rem !important;
      padding: 0.5rem 0.9rem !important;
      border-radius: 999px !important;
      box-sizing: border-box !important;
      text-align: center !important;
      font-weight: 950 !important;
      line-height: 1.15 !important;
      box-shadow: 0 0.28rem 0.75rem rgba(97, 65, 35, 0.09) !important;
      opacity: 1 !important;
      transform: translateY(0) !important;
      transition:
        opacity 180ms ease,
        transform 180ms ease,
        background-color 180ms ease,
        color 180ms ease !important;
    }

    #word-feedback.boggle-word-feedback-accepted {
      background: #dff3cc !important;
      border: 2px solid rgba(54, 157, 73, 0.36) !important;
      color: #145f25 !important;
    }

    #word-feedback.boggle-word-feedback-invalid {
      background: #ffd8cf !important;
      border: 2px solid rgba(228, 75, 61, 0.36) !important;
      color: #9d1f18 !important;
    }

    #word-feedback.boggle-word-feedback-duplicate {
      background: #efd4aa !important;
      border: 2px solid rgba(165, 100, 28, 0.36) !important;
      color: #7b4714 !important;
    }

    #board .board-cell.board-cell-feedback-accepted,
    #board .board-cell.board-cell-feedback-invalid,
    #board .board-cell.board-cell-feedback-duplicate {
      position: relative !important;
      background-repeat: no-repeat !important;
      outline: none !important;
      transform: translateY(-1px) !important;
      animation: boggle-cell-feedback-v25 575ms ease-out forwards !important;
    }

    #board .board-cell.board-cell-feedback-accepted {
      background: #daf6cf !important;
      border-color: #29a747 !important;
      color: #104d20 !important;
      box-shadow:
        inset 0 0 0 2px rgba(239, 255, 231, 0.86),
        0 0 0 3px rgba(41, 167, 71, 0.24),
        0 0.5rem 0.95rem rgba(41, 167, 71, 0.18) !important;
    }

    #board .board-cell.board-cell-feedback-invalid {
      background: #ffd4cc !important;
      border-color: #ef5145 !important;
      color: #7d1d16 !important;
      box-shadow:
        inset 0 0 0 2px rgba(255, 244, 241, 0.84),
        0 0 0 3px rgba(239, 81, 69, 0.24),
        0 0.5rem 0.95rem rgba(239, 81, 69, 0.18) !important;
      animation: boggle-cell-invalid-v25 575ms ease-out forwards !important;
    }

    #board .board-cell.board-cell-feedback-duplicate {
      background: #e5c28d !important;
      border-color: #a8671f !important;
      color: #60350f !important;
      box-shadow:
        inset 0 0 0 2px rgba(255, 236, 199, 0.72),
        0 0 0 3px rgba(168, 103, 31, 0.25),
        0 0.5rem 0.95rem rgba(126, 83, 39, 0.17) !important;
    }

    @keyframes boggle-cell-feedback-v25 {
      0% {
        filter: saturate(0.95) brightness(1);
      }

      22% {
        filter: saturate(1.1) brightness(1.025);
      }

      64% {
        filter: saturate(1.05) brightness(1.01);
      }

      100% {
        filter: none;
      }
    }

    @keyframes boggle-cell-invalid-v25 {
      0%, 100% {
        transform: translateY(-1px) translateX(0);
        filter: none;
      }

      18% {
        transform: translateY(-1px) translateX(-2px);
        filter: saturate(1.1) brightness(1.025);
      }

      36% {
        transform: translateY(-1px) translateX(2px);
      }

      54% {
        transform: translateY(-1px) translateX(-1px);
      }

      72% {
        transform: translateY(-1px) translateX(1px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #board .board-cell.board-cell-feedback-accepted,
      #board .board-cell.board-cell-feedback-invalid,
      #board .board-cell.board-cell-feedback-duplicate {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

