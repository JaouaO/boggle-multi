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
  if (!anchorElement) {
    return;
  }

  injectFeedbackStyle();

  anchorElement.classList.remove(
    "boggle-feedback-accepted",
    "boggle-feedback-invalid",
    "boggle-feedback-duplicate"
  );

  anchorElement.classList.add("boggle-feedback-host", `boggle-feedback-${type}`);

  let badge = anchorElement.querySelector(".boggle-feedback-badge");

  if (!badge) {
    badge = document.createElement("span");
    badge.className = "boggle-feedback-badge";
    anchorElement.appendChild(badge);
  }

  badge.textContent = label;

  window.clearTimeout(feedbackTimeout);

  feedbackTimeout = window.setTimeout(() => {
    anchorElement.classList.remove(
      "boggle-feedback-accepted",
      "boggle-feedback-invalid",
      "boggle-feedback-duplicate"
    );

    badge.remove();
  }, 850);
}

function showBoardFeedback(boardElement, path, type) {
  if (!boardElement || !Array.isArray(path) || path.length === 0) {
    return;
  }

  injectFeedbackStyle();

  boardElement.classList.remove(
    "boggle-board-feedback-accepted",
    "boggle-board-feedback-invalid",
    "boggle-board-feedback-duplicate"
  );

  boardElement.classList.add(`boggle-board-feedback-${type}`);

  const highlightedCells = [];

  for (const cell of path) {
    const element = boardElement.querySelector(
      `.board-cell[data-row="${cell.row}"][data-col="${cell.col}"]`
    );

    if (!element) {
      continue;
    }

    element.classList.remove(
      "board-cell-feedback-accepted",
      "board-cell-feedback-invalid",
      "board-cell-feedback-duplicate"
    );

    element.classList.add(`board-cell-feedback-${type}`);
    highlightedCells.push(element);
  }

  window.setTimeout(() => {
    boardElement.classList.remove(
      "boggle-board-feedback-accepted",
      "boggle-board-feedback-invalid",
      "boggle-board-feedback-duplicate"
    );

    for (const element of highlightedCells) {
      element.classList.remove(
        "board-cell-feedback-accepted",
        "board-cell-feedback-invalid",
        "board-cell-feedback-duplicate"
      );
    }
  }, 950);
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
  style.textContent = `
    .boggle-feedback-host {
      position: relative;
    }

    .boggle-feedback-badge {
      position: absolute;
      top: -0.75rem;
      right: 0.75rem;
      z-index: 20;
      min-width: 2.25rem;
      padding: 0.35rem 0.55rem;
      border: 2px solid currentColor;
      border-radius: 999px;
      background: var(--paper, #fffaf1);
      color: var(--ink, #2a211c);
      font-size: 0.92rem;
      font-weight: 950;
      line-height: 1;
      text-align: center;
      pointer-events: none;
    }

    .boggle-feedback-accepted {
      outline: none !important;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--success, #4d7653) 35%, transparent) !important;
      border-radius: 9999px !important;
    }

    .boggle-feedback-accepted .boggle-feedback-badge {
      color: var(--success, #4d7653);
    }

    .boggle-feedback-invalid {
      outline: none !important;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger, #8f3f2d) 35%, transparent) !important;
      border-radius: 9999px !important;
    }

    .boggle-feedback-invalid .boggle-feedback-badge {
      color: var(--danger, #8f3f2d);
    }

    .boggle-feedback-duplicate {
      outline: none !important;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--warning, #8a5a1d) 35%, transparent) !important;
      border-radius: 9999px !important;
    }

    .boggle-feedback-duplicate .boggle-feedback-badge {
      color: var(--warning, #8a5a1d);
    }

    #board.boggle-board-feedback-accepted {
      border-color: color-mix(in srgb, var(--success, #4d7653) 58%, var(--board-line, #b99d83)) !important;
    }

    #board.boggle-board-feedback-invalid {
      border-color: color-mix(in srgb, var(--danger, #8f3f2d) 58%, var(--board-line, #b99d83)) !important;
    }

    #board.boggle-board-feedback-duplicate {
      border-color: color-mix(in srgb, var(--warning, #8a5a1d) 58%, var(--board-line, #b99d83)) !important;
    }

    .board-cell-feedback-accepted,
    .board-cell-feedback-invalid,
    .board-cell-feedback-duplicate {
      outline-offset: -4px !important;
      background-repeat: no-repeat !important;
    }

    .board-cell-feedback-accepted {
      --cell-feedback-center: color-mix(in srgb, var(--success, #4d7653) 10%, var(--tile, #fff8ea));
      --cell-feedback-edge: color-mix(in srgb, var(--success, #4d7653) 64%, var(--tile, #fff8ea));
      --cell-feedback-outline: color-mix(in srgb, var(--success, #4d7653) 84%, transparent);
      --cell-feedback-glow: color-mix(in srgb, var(--success, #4d7653) 58%, transparent);
    }

    .board-cell-feedback-invalid {
      --cell-feedback-center: color-mix(in srgb, var(--danger, #8f3f2d) 9%, var(--tile, #fff8ea));
      --cell-feedback-edge: color-mix(in srgb, var(--danger, #8f3f2d) 60%, var(--tile, #fff8ea));
      --cell-feedback-outline: color-mix(in srgb, var(--danger, #8f3f2d) 84%, transparent);
      --cell-feedback-glow: color-mix(in srgb, var(--danger, #8f3f2d) 56%, transparent);
    }

    .board-cell-feedback-duplicate {
      --cell-feedback-center: color-mix(in srgb, var(--warning, #8a5a1d) 10%, var(--tile, #fff8ea));
      --cell-feedback-edge: color-mix(in srgb, var(--warning, #8a5a1d) 64%, var(--tile, #fff8ea));
      --cell-feedback-outline: color-mix(in srgb, var(--warning, #8a5a1d) 84%, transparent);
      --cell-feedback-glow: color-mix(in srgb, var(--warning, #8a5a1d) 56%, transparent);
    }

    .board-cell-feedback-accepted,
    .board-cell-feedback-invalid,
    .board-cell-feedback-duplicate {
      --cell-feedback-gradient:
        radial-gradient(circle at center,
          var(--cell-feedback-center) 0%,
          var(--cell-feedback-center) 38%,
          var(--cell-feedback-edge) 100%);
    }

    @media (prefers-reduced-motion: no-preference) {
      .boggle-feedback-accepted .boggle-feedback-badge,
      .boggle-feedback-invalid .boggle-feedback-badge,
      .boggle-feedback-duplicate .boggle-feedback-badge {
        animation: boggle-feedback-pop 850ms ease-out forwards;
      }

      .boggle-feedback-invalid {
        animation: boggle-feedback-shake 180ms ease-out;
      }

      .board-cell-feedback-accepted,
      .board-cell-feedback-invalid,
      .board-cell-feedback-duplicate {
        animation: boggle-cell-feedback-fade 950ms ease-out forwards;
      }

      #board.boggle-board-feedback-accepted,
      #board.boggle-board-feedback-invalid,
      #board.boggle-board-feedback-duplicate {
        animation: boggle-board-feedback-fade 950ms ease-out forwards;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .board-cell-feedback-accepted,
      .board-cell-feedback-invalid,
      .board-cell-feedback-duplicate {
        background: var(--cell-feedback-gradient) !important;
        outline: 2px solid var(--cell-feedback-outline) !important;
        box-shadow:
          inset 0 0 0 4px var(--cell-feedback-glow),
          0 0 0 2px var(--cell-feedback-glow) !important;
      }
    }

    @keyframes boggle-feedback-pop {
      0% {
        transform: translateY(0.25rem) scale(0.92);
        opacity: 0;
      }

      20% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      100% {
        transform: translateY(-0.25rem) scale(1);
        opacity: 0;
      }
    }

    @keyframes boggle-cell-feedback-fade {
      0% {
        background: var(--tile, #fff8ea);
        outline: 2px solid transparent;
        box-shadow:
          inset 0 0 0 0 transparent,
          0 0 0 0 transparent;
      }

      10% {
        background: var(--cell-feedback-gradient);
        outline: 2px solid var(--cell-feedback-outline);
        box-shadow:
          inset 0 0 0 4px var(--cell-feedback-glow),
          0 0 0 2px var(--cell-feedback-glow);
      }

      44% {
        background: var(--cell-feedback-gradient);
        outline: 2px solid var(--cell-feedback-outline);
        box-shadow:
          inset 0 0 0 4px var(--cell-feedback-glow),
          0 0 0 2px var(--cell-feedback-glow);
      }

      100% {
        background: var(--tile, #fff8ea);
        outline: 2px solid transparent;
        box-shadow:
          inset 0 0 0 0 transparent,
          0 0 0 0 transparent;
      }
    }

    @keyframes boggle-board-feedback-fade {
      0% {
        filter: none;
      }

      12% {
        filter: brightness(1.025);
      }

      42% {
        filter: brightness(1.025);
      }

      100% {
        filter: none;
      }
    }

    @keyframes boggle-feedback-shake {
      0%, 100% {
        transform: translateX(0);
      }

      30% {
        transform: translateX(-3px);
      }

      65% {
        transform: translateX(3px);
      }
    }
  `;

  document.head.appendChild(style);
}
