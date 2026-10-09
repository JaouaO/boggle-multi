// Styles d'interface extraits de main.js pour garder la logique de jeu lisible.
// Les couches restent injectées dans le même ordre pour préserver le rendu existant.

export function applyThemeStyles() {
  injectLegacyThemeFoundationV42();
  injectTopLaunchEndScreenLayoutV39();
  injectRulesHelpOptionsPanelV38();
  injectFoundWordsPanelV37();
  injectFinalBoardInputV36();
  injectFinalButtonsV34();
}

function createStyleElementOnce(id) {
  if (document.getElementById(id)) {
    return null;
  }

  const style = document.createElement("style");
  style.id = id;
  return style;
}

function appendStyleElement(style) {
  document.head.appendChild(style);
}

function injectLegacyThemeFoundationV42() {
  const style = createStyleElementOnce("boggle-legacy-theme-foundation-v42-style");
  if (!style) {
    return;
  }

  style.textContent = `
    /*
     * Les @import doivent rester avant toute règle CSS.
     * Sinon la police Fredoka/Nunito peut être ignorée après fusion des couches.
     */
    @import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap");

    /*
     * V42 : fusion des anciennes couches visuelles historiques.
     * L'ordre interne est conservé pour préserver exactement la cascade CSS.
     */

    /* Ancienne couche : injectDesignPassStyles. */
    :root {
      --boggle-ink: #4b3322;
      --boggle-line: rgba(90, 59, 35, 0.22);
      --boggle-paper-soft: rgba(255, 248, 234, 0.76);
      --boggle-paper-strong: rgba(255, 248, 234, 0.96);
      --boggle-pill: rgba(90, 59, 35, 0.08);
      --boggle-danger: #b42318;
      --boggle-danger-line: #7f1d1d;
      --boggle-radius-button: 0.65rem;
      --boggle-radius-badge: 999px;
    }

    button:not(.board-cell),
    .ui-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.15rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--boggle-radius-button);
      font-weight: 850;
      line-height: 1.15;
      cursor: pointer;
      box-sizing: border-box;
    }

    button:not(.board-cell):disabled,
    .ui-button:disabled {
      opacity: 0.52;
      cursor: not-allowed;
    }

    .info-badge,
    #game-status,
    #timer,
    #status,
    .rule-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 1.85rem;
      padding: 0 0.58rem;
      border: 1px solid rgba(90, 59, 35, 0.16);
      border-radius: var(--boggle-radius-badge);
      background: var(--boggle-pill);
      color: var(--boggle-ink);
      font-weight: 850;
      line-height: 1.1;
      white-space: nowrap;

    }
    .info-badge,
    #game-status,
    #timer,
    .rule-pill {
      box-sizing: border-box;
    }

    .info-badge-strong,
    #status.connected-badge {
      border-color: rgba(90, 59, 35, 0.28);
      background: rgba(255, 248, 234, 0.9);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
    }

    .compact-badge {
      min-height: 1.15rem;
      padding: 0.08rem 0.24rem;
      font-size: 0.62rem;
      font-weight: 800;
    }

    .danger-button,
    #end-game {
      border: 2px solid var(--boggle-danger-line) !important;
      background: var(--boggle-danger) !important;
      color: #fff !important;
      font-weight: 900 !important;
    }

    #boggle-top {

      flex-wrap: wrap;
    }

    #connection-controls {

      align-items: center;
      gap: 0.55rem;

    }

    #connection-controls #player-preferences {
      margin-left: auto !important;
    }

    .connection-control {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 2.3rem;
    }

    #connection-actions {

      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
      min-height: 2.3rem;
    }

    #boggle-top input,
    #boggle-top button,
    #connection-status-line,
    #player-preferences {
      align-self: center;
    }

    #boggle-top input,
    #boggle-top button {
      line-height: 1.2;
    }

    #launch-panel > h2 {
      display: none !important;
    }

    #mode-options-toggle {
      width: 100%;
      justify-content: space-between;
      text-align: left;
      margin: 0;
    }

    #mode-options-toggle::after {
      content: "▾";
      margin-left: 0.75rem;
      transition: transform 160ms ease;
    }

    #mode-options-toggle[aria-expanded="false"]::after {
      transform: rotate(-90deg);
    }

    #mode-options-body {
      margin-top: 0.85rem;
    }

    #timer.boggle-timer-ending {
      animation: boggle-timer-warning 0.55s ease-in-out infinite alternate;
      border-color: rgba(180, 35, 24, 0.55) !important;
    }

    @keyframes boggle-timer-warning {
      from {
        transform: translateY(0);
        box-shadow: 0 0 0 0 rgba(180, 35, 24, 0.16);
      }
      to {
        transform: translateY(-1px);
        box-shadow: 0 0 0 0.2rem rgba(180, 35, 24, 0.13);
      }
    }

    .boggle-confetti-piece {
      position: fixed;
      top: -1rem;
      z-index: 21000;
      width: 0.55rem;
      height: 0.85rem;
      border-radius: 0.15rem;
      pointer-events: none;
      animation: boggle-confetti-fall 3.8s linear forwards;
    }

    @keyframes boggle-confetti-fall {
      0% {
        transform: translate3d(0, -1rem, 0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translate3d(var(--confetti-drift), 105vh, 0) rotate(720deg);
        opacity: 0;
      }
    }

    #mouse-input-panel {
      display: none !important;
    }

    #game-status {
      width: fit-content;
    }

    #timer {
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    #play-status-panel {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }

    #play-status-panel #game-status,
    #play-status-panel #timer,
    #play-status-panel #end-game {
      align-self: center;
      margin-top: 0;
      margin-bottom: 0;
    }

    #play-status-panel > h2 {
      flex-basis: 100%;
      width: 100%;
    }

    #connection-status-line {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-left: 0;
      padding: 0.28rem 0.45rem;
      border-radius: 999px;
      background: rgba(255, 248, 234, 0.7);
      line-height: 1.1;
      min-height: 2.15rem;
    }

    #connection-status-line[hidden] {
      display: none !important;
    }

    #connection-status-line:not([hidden]) {
      display: inline-flex !important;
    }

    #status {
      flex-shrink: 0;
    }

    .connection-field-label {
      display: inline-flex;
      align-items: center;
      align-self: center;
      margin: 0;
      font-weight: 850;
      color: #4b3322;
      line-height: 1.2;
      white-space: nowrap;
    }

    #boggle-top input,
    #boggle-top button {
      align-self: center;
      min-height: 2.15rem;
    }

    #copy-room-link {
      display: none !important;
    }

    #boggle-left {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 10rem);
    }

    #found-words-panel {
      display: flex;
      flex: 1 1 auto;
      min-height: 14rem;
      overflow: hidden;
      flex-direction: column;
    }

    #found-words {
      flex: 1 1 auto;
      min-height: 0 !important;
      max-height: none !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      overscroll-behavior: contain;
      padding-right: 0.35rem;
      box-sizing: border-box;
      scrollbar-width: thin;
      align-content: flex-start;
    }

    #players-panel {
      overflow: hidden;
    }

    #players {
      --player-row-height: 2rem;
      --player-row-gap: 0.1rem;
      height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3));
      max-height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3));
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      overscroll-behavior: contain;
      padding-right: 0.25rem;
      box-sizing: content-box;
    }

    .players-scroll-list {
      display: grid;
      grid-auto-rows: var(--player-row-height);
      gap: var(--player-row-gap);
      margin: 0;
      padding: 0;
      list-style: none;
      min-height: 100%;
    }

    .player-row {
      height: var(--player-row-height);
      min-height: 0;
      box-sizing: border-box;
      padding: 0.12rem 0.24rem;
      border: 0;
      border-radius: 0.35rem;
      background: transparent;
      overflow: hidden;
    }

    .player-row-current {
      position: sticky;
      bottom: 0;
      z-index: 3;
      background: rgba(255, 248, 234, 0.96);
      box-shadow:
        inset 3px 0 0 rgba(90, 59, 35, 0.34),
        0 -0.25rem 0.45rem rgba(63, 43, 27, 0.08);
    }

    .player-rank {
      min-width: 1.75rem;
      font-variant-numeric: tabular-nums;
      opacity: 0.72;
    }

    .player-name-line {
      min-width: 0;
      overflow: hidden;
    }

    .player-badges {
      display: inline-flex;
      gap: 0.12rem;
      flex-wrap: nowrap;
      flex-shrink: 0;
    }

    .player-score-line {
      white-space: nowrap;
      font-size: 0.78rem;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    #found-words ol,
    #found-words ul {
      margin-top: 0.35rem;
    }

    #found-words li {
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    #mouse-input-panel {
      display: none !important;
    }

    #player-preferences {

      pointer-events: none;
    }

    #player-preferences > button {
      pointer-events: auto;
      padding: 0.5rem 0.75rem;
      border-radius: var(--boggle-radius-button);
    }

    #player-preferences-body {
      position: absolute;
      right: 0;
      top: calc(100% + 0.45rem);
      width: min(18rem, calc(100vw - 1.5rem));
      pointer-events: auto;
      padding: 0.8rem;
      border: 1px solid rgba(90, 59, 35, 0.22);
      border-radius: 1rem;
      background: rgba(255, 248, 234, 0.96);
      box-shadow: 0 1rem 2rem rgba(63, 43, 27, 0.18);
      backdrop-filter: blur(6px);
    }

    #help-slot {
      width: 100%;
      max-height: calc(100vh - 12rem);
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      box-sizing: border-box;
    }

    #rules-summary {
      width: 100%;
      box-sizing: border-box;
      margin: 0 0 0.65rem;
      padding: 0 0 0.55rem;
      border-bottom: 1px solid rgba(90, 59, 35, 0.12);
    }

    #rules-summary[hidden] {
      display: none !important;
    }

    #help-panel {
      max-height: none;
      overflow: visible;
    }

    #welcome-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
      box-sizing: border-box;
      padding: 1.2rem 0;
    }

    #welcome-panel[hidden] {
      display: none !important;
    }

    .welcome-board {
      width: min(100%, 24rem);
      margin: 0 auto;
    }

    .welcome-board .board-cell {
      min-height: clamp(2.6rem, 10vw, 4.2rem) !important;
      pointer-events: none;
      border: 1px solid rgba(90, 59, 35, 0.22) !important;
      border-radius: 0.75rem !important;
      background: rgba(255, 248, 234, 0.94) !important;
      color: #4b3322 !important;
      box-shadow: 0 0.25rem 0.65rem rgba(63, 43, 27, 0.08) !important;
      font-weight: 950 !important;
    }

    .welcome-board .board-letter {
      font-size: clamp(1.1rem, 3vw, 1.8rem);
      font-weight: 950;
      line-height: 1;
    }

    .welcome-board .board-cell[data-letter=""] {
      opacity: 0.38;
      background: rgba(255, 248, 234, 0.42) !important;
      box-shadow: inset 0 0 0 1px rgba(90, 59, 35, 0.05) !important;
    }

    .welcome-caption {
      max-width: 28rem;
      margin: 0;
      text-align: center;
      color: #4b3322;
      font-weight: 850;
      opacity: 0.86;
    }

    .rule-pill {
      gap: 0.35rem;
      margin: 0.15rem 0.35rem 0.15rem 0;
      font-weight: 900;
    }

    .rule-pill-danger {
      border: 2px solid rgba(169, 67, 63, 0.46);
      background: rgba(169, 67, 63, 0.12);
      color: #7f2e2b;
    }

    .rule-pill-warning {
      border: 2px solid rgba(154, 100, 34, 0.38);
      background: rgba(246, 213, 140, 0.5);
      color: #6a4317;
    }

    /* Ancienne couche : injectFruityThemeOverrides. */
    :root {
      --fruit-bg: #f7efd9;
      --fruit-bg-2: #f3e4bf;
      --fruit-panel: rgba(255, 250, 236, 0.92);
      --fruit-panel-strong: rgba(255, 250, 239, 0.98);
      --fruit-line: rgba(122, 87, 52, 0.16);
      --fruit-brown: #704223;
      --fruit-brown-soft: #8a5a36;
      --fruit-orange: #ec8a43;
      --fruit-orange-dark: #d66d26;
      --fruit-yellow: #f6d768;
      --fruit-yellow-soft: #fdecb0;
      --fruit-green: #9db978;
      --fruit-green-soft: #dcebc6;
      --fruit-red-soft: #ffe0d5;
      --fruit-shadow: 0 0.7rem 1.6rem rgba(99, 70, 40, 0.08);
      --fruit-font: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
    }

    html, body {
      min-height: 100%;
      background-color: var(--fruit-bg) !important;
      color: var(--fruit-brown) !important;
      font-family: var(--fruit-font);
    }

    body {
      background-image:
        linear-gradient(180deg, rgba(255,255,255,0.42), rgba(244,228,186,0.38)),
        url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27220%27%20viewBox%3D%270%200%20260%20220%27%3E%0A%3Crect%20width%3D%27260%27%20height%3D%27220%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M35%2058c18-14%2034-14%2047%202-16-1-30%206-40%2020%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%278%27%20opacity%3D%27.22%27/%3E%0A%3Cpath%20d%3D%27M54%2076c-9%2011-10%2020-4%2031%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%276%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M194%2042c9%200%2017%206%2021%2015-9-2-18%200-25%207%27%20stroke%3D%27%23A7C287%27%20stroke-width%3D%278%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27174%27%20cy%3D%27140%27%20r%3D%277%27%20fill%3D%27%23F2A76A%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27189%27%20cy%3D%27151%27%20r%3D%275%27%20fill%3D%27%23E7C760%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27203%27%20cy%3D%27139%27%20r%3D%274%27%20fill%3D%27%23E6A97A%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M100%20176h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.14%27/%3E%0A%3Cpath%20d%3D%27M107%20164h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M209%20174c11-6%2019-4%2028%206-10-1-18%201-25%208%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%277%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M121%2077l6%206%206-6%206%206%206-6%27%20stroke%3D%27%23F2B06C%27%20stroke-width%3D%274%27%20opacity%3D%27.16%27/%3E%0A%3C/g%3E%0A%3C/svg%3E") !important;
      background-size: auto, 260px 220px !important;
      background-repeat: repeat, repeat !important;
      background-attachment: fixed, fixed !important;
    }

    #boggle-shell {
      width: min(100%, 108rem) !important;
      padding: 1rem !important;
    }

    #boggle-top {

      overflow: hidden;

      padding: 1rem 1.2rem !important;
      background:
        linear-gradient(180deg, rgba(255,252,245,0.98), rgba(251,240,214,0.93)) !important;
    }

    #boggle-top::after {
      content: "";
      position: absolute;
      right: 1rem;
      bottom: 0.15rem;
      width: 15rem;
      height: 5.3rem;
      background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27280%27%20height%3D%2796%27%20viewBox%3D%270%200%20280%2096%27%3E%0A%3Crect%20width%3D%27280%27%20height%3D%2796%27%20fill%3D%27none%27/%3E%0A%3Cg%20opacity%3D%27.95%27%3E%0A%3Cg%20transform%3D%27translate%2812%2012%29%27%3E%0A%3Ccircle%20cx%3D%2734%27%20cy%3D%2744%27%20r%3D%2726%27%20fill%3D%27%23F2A45F%27/%3E%0A%3Ccircle%20cx%3D%2734%27%20cy%3D%2744%27%20r%3D%2724%27%20fill%3D%27%23F2A45F%27%20stroke%3D%27%23DB8A40%27%20stroke-width%3D%272%27/%3E%0A%3Ccircle%20cx%3D%2727%27%20cy%3D%2741%27%20r%3D%272.6%27%20fill%3D%27%236D4124%27/%3E%0A%3Ccircle%20cx%3D%2741%27%20cy%3D%2741%27%20r%3D%272.6%27%20fill%3D%27%236D4124%27/%3E%0A%3Cpath%20d%3D%27M29%2051c4%204%2010%204%2014%200%27%20stroke%3D%27%236D4124%27%20stroke-width%3D%272.5%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%0A%3Cellipse%20cx%3D%2717%27%20cy%3D%2752%27%20rx%3D%274%27%20ry%3D%275%27%20fill%3D%27%23F8C49A%27%20opacity%3D%27.55%27/%3E%0A%3Cellipse%20cx%3D%2751%27%20cy%3D%2752%27%20rx%3D%274%27%20ry%3D%275%27%20fill%3D%27%23F8C49A%27%20opacity%3D%27.55%27/%3E%0A%3Cpath%20d%3D%27M32%2017c4-8%2011-11%2018-9-2%207-7%2013-15%2016%27%20fill%3D%27%238FB56B%27/%3E%0A%3Cpath%20d%3D%27M36%2018c-6-4-12-4-18-1%203%207%209%2011%2016%2012%27%20fill%3D%27%23A8C881%27/%3E%0A%3C/g%3E%0A%3Cg%20transform%3D%27translate%28104%200%29%27%3E%0A%3Ccircle%20cx%3D%2750%27%20cy%3D%2752%27%20r%3D%2731%27%20fill%3D%27%23F6E9C7%27%20stroke%3D%27%23DFC78F%27%20stroke-width%3D%272%27/%3E%0A%3Ccircle%20cx%3D%2741%27%20cy%3D%2749%27%20r%3D%272.8%27%20fill%3D%27%237C5532%27/%3E%0A%3Ccircle%20cx%3D%2758%27%20cy%3D%2749%27%20r%3D%272.8%27%20fill%3D%27%237C5532%27/%3E%0A%3Cpath%20d%3D%27M43%2060c4%204%2010%204%2014%200%27%20stroke%3D%27%237C5532%27%20stroke-width%3D%272.7%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%0A%3Cellipse%20cx%3D%2731%27%20cy%3D%2759%27%20rx%3D%274.5%27%20ry%3D%275.5%27%20fill%3D%27%23F9DDB8%27%20opacity%3D%27.6%27/%3E%0A%3Cellipse%20cx%3D%2769%27%20cy%3D%2759%27%20rx%3D%274.5%27%20ry%3D%275.5%27%20fill%3D%27%23F9DDB8%27%20opacity%3D%27.6%27/%3E%0A%3Cpath%20d%3D%27M39%2023c8-6%2018-8%2027-4%27%20stroke%3D%27%23D8C085%27%20stroke-width%3D%273%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%0A%3C/g%3E%0A%3Cg%20fill%3D%27%23A7C287%27%20opacity%3D%27.9%27%3E%0A%3Cpath%20d%3D%27M2%2072c10-10%2021-12%2031-6-10%202-18%208-24%2018%27/%3E%0A%3Cpath%20d%3D%27M233%2076c12-10%2024-10%2035%200-11%201-20%206-27%2015%27/%3E%0A%3Cpath%20d%3D%27M248%2058c10-8%2019-8%2028-1-8%202-15%206-20%2014%27/%3E%0A%3C/g%3E%0A%3Cg%20fill%3D%27%23F5BE76%27%20opacity%3D%27.75%27%3E%0A%3Ccircle%20cx%3D%270%27%20cy%3D%2712%27%20r%3D%276%27/%3E%3Ccircle%20cx%3D%27262%27%20cy%3D%2718%27%20r%3D%276%27/%3E%3Ccircle%20cx%3D%27230%27%20cy%3D%2710%27%20r%3D%274%27/%3E%0A%3C/g%3E%0A%3C/g%3E%3C/svg%3E") center / contain no-repeat;
      opacity: 0.95;
      pointer-events: none;
    }

    #connection-controls,
    #connection-actions,
    .connection-control {

      z-index: 1;
    }
    #connection-actions,
    .connection-control {
      position: relative;
    }

    .connection-field-label,
    #players-panel > h2,
    #found-words-panel > h2,
    #launch-panel > h2,
    #play-status-panel > h2,
    #help-panel > h2 {
      color: var(--fruit-brown) !important;
      font-weight: 900 !important;

    }
    .connection-field-label,
    #launch-panel > h2,
    #play-status-panel > h2,
    #help-panel > h2 {
      letter-spacing: 0.01em;
    }

    #players-panel > h2::before { content: "👥 "; }
    #found-words-panel > h2::before { content: "📖 "; }
    #play-status-panel > h2::before { content: "🎮 "; }
    #help-panel > h2::before { content: "💡 "; }

    button:not(.board-cell),
    .ui-button {
      border: 1px solid rgba(176, 103, 41, 0.28) !important;
      border-radius: 0.95rem !important;
      background: linear-gradient(180deg, #f39a53, #ea7e33) !important;
      color: #fff8f1 !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.26),
        0 0.3rem 0.75rem rgba(170, 101, 38, 0.14) !important;
      font-weight: 900 !important;
      text-shadow: 0 1px 0 rgba(125, 60, 17, 0.18);
    }

    button:not(.board-cell):hover,
    .ui-button:hover {
      filter: saturate(1.02) brightness(1.02);
      transform: translateY(-1px);
    }

    button:not(.board-cell):disabled,
    .ui-button:disabled {
      background: rgba(233, 205, 159, 0.85) !important;
      color: rgba(112, 66, 35, 0.58) !important;
      border-color: rgba(152, 120, 80, 0.16) !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    #end-game,
    .danger-button {
      background: linear-gradient(180deg, #ef7661, #e65b4f) !important;
      border-color: rgba(166, 46, 38, 0.35) !important;
      color: #fff6f4 !important;
      box-shadow: 0 0.35rem 0.85rem rgba(203, 90, 74, 0.18) !important;
    }

    #player-preferences > button {
      background: linear-gradient(180deg, #f6efe1, #f3e7cd) !important;
      color: var(--fruit-brown) !important;
      border: 1px solid rgba(122,87,52,0.16) !important;
      text-shadow: none !important;
      box-shadow: 0 0.25rem 0.8rem rgba(99,70,40,0.08) !important;
    }

    #player-preferences > button::before {
      content: "⚙️ ";
    }

    #boggle-top input,
    #word-input,
    #mode-controls input,
    #mode-controls select,
    #mode-controls textarea {
      border: 1px solid rgba(122, 87, 52, 0.18) !important;

      background: rgba(255, 252, 242, 0.96) !important;
      color: var(--fruit-brown) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45) !important;
    }
    #boggle-top input,
    #mode-controls input,
    #mode-controls select,
    #mode-controls textarea {
      border-radius: 0.8rem !important;
    }

    .info-badge,
    #game-status,
    #timer,
    #status,
    .rule-pill {
      border: 1px solid rgba(122, 87, 52, 0.12) !important;
      background: rgba(255, 250, 238, 0.96) !important;
      color: var(--fruit-brown) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
      border-radius: 999px !important;
      font-weight: 900 !important;
    }

    #status.connected-badge {
      background: rgba(239, 249, 223, 0.98) !important;
      color: #577e2c !important;
      border-color: rgba(122, 163, 74, 0.22) !important;
    }

    #status.connected-badge::before {
      content: "●";
      color: #77b42b;
      margin-right: 0.45rem;
      font-size: 0.95em;
    }

    #game-status {
      background: rgba(255,252,240,0.98) !important;
      font-size: 1rem;
      padding-inline: 0.95rem !important;
    }

    #timer {
      background: linear-gradient(180deg, #f8e7aa, #f4d66d) !important;
      color: #6b481c !important;
      border-color: rgba(173, 135, 52, 0.18) !important;
      padding-inline: 1rem !important;
      font-size: 1.1rem;
    }

    #board {
      position: relative;
      padding: 1rem !important;
      border-radius: 1.55rem !important;
      background:
        linear-gradient(180deg, rgba(233, 204, 131, 0.82), rgba(217, 178, 99, 0.72)) !important;
      border: 1px solid rgba(147, 103, 50, 0.16) !important;
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.2),
        0 0.9rem 2rem rgba(99,70,40,0.12) !important;
    }

    #board .board-cell {
      border: 1px solid rgba(131, 98, 63, 0.13) !important;
      border-radius: 1rem !important;
      background:
        radial-gradient(circle at 18% 18%, rgba(255,255,255,0.72) 0 0.2rem, transparent 0.22rem),
        radial-gradient(circle at 84% 84%, rgba(223, 198, 154, 0.32) 0 0.18rem, transparent 0.2rem),
        linear-gradient(180deg, #fffaf0, #fdf2da) !important;
      color: #5d361b !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.82),
        0 0.32rem 0.8rem rgba(100, 70, 40, 0.08) !important;
    }

    #board .board-letter {
      color: #6a3e1f !important;
      font-weight: 950 !important;
      text-shadow: 0 1px 0 rgba(255,255,255,0.44);
    }

    .welcome-board {
      padding: 0.8rem;
      border-radius: 1.35rem;
      background: linear-gradient(180deg, rgba(233, 204, 131, 0.72), rgba(217, 178, 99, 0.62));
      border: 1px solid rgba(147, 103, 50, 0.14);
    }

    .welcome-caption {
      margin-top: 0.85rem;
      color: var(--fruit-brown-soft);
      font-weight: 800;
      text-align: center;
    }

    #players-panel,
    #found-words-panel,
    #help-panel,
    #launch-panel,
    #play-status-panel {
      overflow: hidden;
    }

    #help-panel > h2,
    #play-status-panel > h2,
    #launch-panel > h2 {
      margin-bottom: 0.8rem !important;
    }
    #help-panel > h2,
    #play-status-panel > h2,
    #launch-panel > h2 {
      font-size: 1rem !important;
    }

    .player-row {
      border-radius: 0.9rem !important;
      padding: 0.18rem 0.35rem !important;
      background: rgba(255, 250, 236, 0.72) !important;
    }

    .player-row:nth-child(1) { background: rgba(249, 223, 127, 0.42) !important; }
    .player-row:nth-child(2) { background: rgba(226, 220, 220, 0.56) !important; }
    .player-row:nth-child(3) { background: rgba(233, 193, 141, 0.48) !important; }

    .player-row-current {
      background: rgba(255, 246, 224, 0.97) !important;
      box-shadow:
        inset 4px 0 0 rgba(239, 146, 58, 0.5),
        0 -0.2rem 0.5rem rgba(90, 59, 35, 0.08) !important;
    }

    .player-rank {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.7rem;
      min-width: 1.7rem;
      height: 1.7rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(122,87,52,0.1);
      font-weight: 900;
    }

    .player-badges .info-badge {
      background: rgba(255, 248, 224, 0.95) !important;
      min-height: 1.3rem !important;
    }

    #found-words {
      scrollbar-color: rgba(190, 149, 97, 0.85) rgba(243, 230, 203, 0.55);
    }

    #found-words::-webkit-scrollbar,
    #players::-webkit-scrollbar,
    #help-slot::-webkit-scrollbar {
      width: 0.55rem;
    }

    #found-words::-webkit-scrollbar-thumb,
    #players::-webkit-scrollbar-thumb,
    #help-slot::-webkit-scrollbar-thumb {
      background: rgba(197, 154, 102, 0.88);
      border-radius: 999px;
    }

    #help-slot {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    #rules-summary {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.55rem !important;
      padding: 0.2rem 0 0.8rem !important;
      margin: 0 0 0.2rem !important;
      border: 0 !important;
      border-bottom: 1px solid rgba(122,87,52,0.08) !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    .rule-pill-danger {
      background: rgba(221, 241, 201, 0.95) !important;
      border-color: rgba(128, 159, 93, 0.24) !important;
      color: #507233 !important;
    }

    .rule-pill-warning {
      background: rgba(255, 226, 217, 0.95) !important;
      border-color: rgba(216, 117, 103, 0.22) !important;
      color: #a44938 !important;
    }

    #help-panel {
      position: relative;
      padding-top: 0.95rem !important;
    }

    #help-panel::after {
      content: "";
      position: absolute;
      right: 0.9rem;
      bottom: 0.65rem;
      width: 4rem;
      height: 4rem;
      background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27220%27%20viewBox%3D%270%200%20260%20220%27%3E%0A%3Crect%20width%3D%27260%27%20height%3D%27220%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M35%2058c18-14%2034-14%2047%202-16-1-30%206-40%2020%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%278%27%20opacity%3D%27.22%27/%3E%0A%3Cpath%20d%3D%27M54%2076c-9%2011-10%2020-4%2031%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%276%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M194%2042c9%200%2017%206%2021%2015-9-2-18%200-25%207%27%20stroke%3D%27%23A7C287%27%20stroke-width%3D%278%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27174%27%20cy%3D%27140%27%20r%3D%277%27%20fill%3D%27%23F2A76A%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27189%27%20cy%3D%27151%27%20r%3D%275%27%20fill%3D%27%23E7C760%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27203%27%20cy%3D%27139%27%20r%3D%274%27%20fill%3D%27%23E6A97A%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M100%20176h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.14%27/%3E%0A%3Cpath%20d%3D%27M107%20164h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M209%20174c11-6%2019-4%2028%206-10-1-18%201-25%208%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%277%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M121%2077l6%206%206-6%206%206%206-6%27%20stroke%3D%27%23F2B06C%27%20stroke-width%3D%274%27%20opacity%3D%27.16%27/%3E%0A%3C/g%3E%0A%3C/svg%3E") center / 140% auto no-repeat;
      opacity: 0.28;
      pointer-events: none;
    }

    #help-panel .help-block,
    #help-panel .help-section,
    #help-panel > div {
      background: rgba(255, 252, 242, 0.68);
      border-radius: 1rem;
      border: 1px solid rgba(122,87,52,0.08);
    }

    #word-feedback {
      color: var(--fruit-brown) !important;
    }

    #launch-panel,
    #play-status-panel,
    #welcome-panel {
      position: relative;
    }

    #launch-panel::before,
    #play-status-panel::before,
    #welcome-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27220%27%20viewBox%3D%270%200%20260%20220%27%3E%0A%3Crect%20width%3D%27260%27%20height%3D%27220%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M35%2058c18-14%2034-14%2047%202-16-1-30%206-40%2020%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%278%27%20opacity%3D%27.22%27/%3E%0A%3Cpath%20d%3D%27M54%2076c-9%2011-10%2020-4%2031%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%276%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M194%2042c9%200%2017%206%2021%2015-9-2-18%200-25%207%27%20stroke%3D%27%23A7C287%27%20stroke-width%3D%278%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27174%27%20cy%3D%27140%27%20r%3D%277%27%20fill%3D%27%23F2A76A%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27189%27%20cy%3D%27151%27%20r%3D%275%27%20fill%3D%27%23E7C760%27%20opacity%3D%27.18%27/%3E%0A%3Ccircle%20cx%3D%27203%27%20cy%3D%27139%27%20r%3D%274%27%20fill%3D%27%23E6A97A%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M100%20176h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.14%27/%3E%0A%3Cpath%20d%3D%27M107%20164h34%27%20stroke%3D%27%23D09A61%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M209%20174c11-6%2019-4%2028%206-10-1-18%201-25%208%27%20stroke%3D%27%239EB87C%27%20stroke-width%3D%277%27%20opacity%3D%27.16%27/%3E%0A%3Cpath%20d%3D%27M121%2077l6%206%206-6%206%206%206-6%27%20stroke%3D%27%23F2B06C%27%20stroke-width%3D%274%27%20opacity%3D%27.16%27/%3E%0A%3C/g%3E%0A%3C/svg%3E");
      background-size: 260px 220px;
      opacity: 0.11;
      pointer-events: none;
    }

    #launch-panel > *,
    #play-status-panel > *,
    #welcome-panel > * {
      position: relative;
      z-index: 1;
    }

    #found-words-panel,
    #players-panel {
      background: linear-gradient(180deg, rgba(255,252,244,0.97), rgba(249,240,218,0.93)) !important;
    }

    @media (max-width: 72rem) {
      #boggle-top::after {
        opacity: 0.24;
      }
    }

    @media (max-width: 58rem) {
      #boggle-top::after {
        display: none;
      }
    }

    /* Ancienne couche : injectMockupCloserTheme. */
    :root {
      --mk-bg: #f8efd8;
      --mk-panel: #fff8e8;
      --mk-panel-2: #fff2d0;
      --mk-line: rgba(111, 73, 40, 0.18);
      --mk-ink: #5d351e;
      --mk-muted: #8a6a4e;
      --mk-orange: #f07f32;
      --mk-orange-dark: #dd6e28;
      --mk-yellow: #f5d872;
      --mk-yellow-soft: #fff0b9;
      --mk-red: #ef6255;
      --mk-red-soft: #ffe0d8;
      --mk-green: #88b65a;
      --mk-green-soft: #e2f0cc;
      --mk-radius: 1.35rem;
      --mk-pill: 999px;
      --mk-shadow: 0 0.4rem 1.1rem rgba(97, 65, 35, 0.08);
      --mk-font: "Trebuchet MS", "Avenir Next", "Segoe UI", system-ui, sans-serif;
    }

    body > h1,
    main > h1,
    #app > h1 {
      display: none !important;
    }

    html,
    body {
      margin: 0 !important;
      min-height: 100% !important;
      background: var(--mk-bg) !important;
      color: var(--mk-ink) !important;
      font-family: var(--mk-font) !important;
    }

    body {
      background-image:
        url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27220%27%20height%3D%27180%27%20viewBox%3D%270%200%20220%20180%27%3E%0A%3Crect%20width%3D%27220%27%20height%3D%27180%27%20fill%3D%27none%27/%3E%0A%3Cg%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%0A%3Cpath%20d%3D%27M30%2048c15-11%2028-10%2040%202-13%200-24%205-33%2017%27%20stroke%3D%27%239eb779%27%20stroke-width%3D%277%27%20opacity%3D%27.12%27/%3E%0A%3Cpath%20d%3D%27M47%2066c-7%209-8%2017-3%2026%27%20stroke%3D%27%239eb779%27%20stroke-width%3D%275%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M162%2038c8%200%2015%205%2018%2013-8-1-15%201-21%207%27%20stroke%3D%27%239eb779%27%20stroke-width%3D%277%27%20opacity%3D%27.11%27/%3E%0A%3Ccircle%20cx%3D%27145%27%20cy%3D%27114%27%20r%3D%275%27%20fill%3D%27%23f1aa62%27%20opacity%3D%27.11%27/%3E%0A%3Ccircle%20cx%3D%27160%27%20cy%3D%27126%27%20r%3D%274%27%20fill%3D%27%23e8c560%27%20opacity%3D%27.10%27/%3E%0A%3Cpath%20d%3D%27M82%20143h31%27%20stroke%3D%27%23d19a63%27%20stroke-width%3D%274%27%20opacity%3D%27.08%27/%3E%0A%3Cpath%20d%3D%27M90%20132h31%27%20stroke%3D%27%23d19a63%27%20stroke-width%3D%274%27%20opacity%3D%27.07%27/%3E%0A%3Cpath%20d%3D%27M95%2063l5%205%205-5%205%205%205-5%27%20stroke%3D%27%23f0ad6e%27%20stroke-width%3D%273.5%27%20opacity%3D%27.09%27/%3E%0A%3C/g%3E%0A%3C/svg%3E") !important;
      background-size: 220px 180px !important;
      background-repeat: repeat !important;
      background-attachment: fixed !important;
    }

    #boggle-shell {
      width: min(100%, 96rem) !important;
      margin: 0 auto !important;
      padding: 0.8rem 1rem 1.2rem !important;
      box-sizing: border-box !important;
    }

    #boggle-top {

      margin: 0 0 0.95rem !important;
      padding: 0.5rem 0.9rem !important;
      border: 1px solid var(--mk-line) !important;
      border-radius: 1.4rem !important;
      background: var(--mk-panel) !important;
      box-shadow: var(--mk-shadow) !important;
      overflow: visible !important;
    }

    #boggle-top::after {
      display: none !important;
    }

    #boggle-brand {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
      min-width: 12.5rem !important;
      padding: 0.1rem 0.35rem 0.1rem 0.15rem !important;
      color: var(--mk-ink) !important;
      white-space: nowrap !important;
    }

    .boggle-brand-mark {
      font-size: clamp(2rem, 3vw, 3.1rem) !important;
      line-height: 0.95 !important;
      font-weight: 950 !important;
      letter-spacing: -0.05em !important;
      color: #7a3f18 !important;
      text-shadow: 0 2px 0 rgba(255, 246, 217, 0.95) !important;
    }

    .boggle-brand-dots {
      display: grid !important;
      grid-template-columns: repeat(2, 0.52rem) !important;
      gap: 0.18rem !important;
      transform: rotate(-8deg) !important;
    }

    .brand-dot {
      width: 0.52rem !important;
      height: 0.52rem !important;
      border-radius: 999px !important;
      display: block !important;
    }

    .brand-dot-orange { background: #f08a3c !important; }
    .brand-dot-yellow { background: #f4c951 !important; }
    .brand-dot-green { background: #94b96d !important; }

    #connection-controls {

      align-items: center !important;
      gap: 0.75rem !important;

    }

    .connection-control {
      display: grid !important;
      grid-template-rows: auto auto !important;
      gap: 0.12rem !important;
      min-height: 0 !important;
      color: var(--mk-ink) !important;
    }

    .connection-field-label {
      font-size: 0.82rem !important;
      color: var(--mk-ink) !important;
      font-weight: 900 !important;
      padding-left: 0.18rem !important;
    }

    #room,
    #name {
      width: clamp(8rem, 13vw, 13rem) !important;
      min-height: 2.25rem !important;
      padding: 0 0.9rem !important;
      border-radius: var(--mk-pill) !important;
      border: 1px solid var(--mk-line) !important;
      background: #fffaf0 !important;
      color: var(--mk-ink) !important;
      box-shadow: none !important;
      font-weight: 850 !important;
    }

    #connection-actions {

      align-items: center !important;
      gap: 0.75rem !important;
      margin-left: 0.1rem !important;
    }

    #connection-controls #player-preferences {
      margin-left: auto !important;
      z-index: 20 !important;
    }

    button:not(.board-cell),
    .ui-button,
    #connect,
    #start,
    #word-submit,
    #mode-options-toggle,
    #player-preferences > button,
    #end-game {

      border: 1px solid transparent !important;
      background-image: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      font-weight: 950 !important;
      letter-spacing: 0 !important;
      transition: transform 120ms ease, filter 120ms ease, background 120ms ease !important;
    }
    button:not(.board-cell),
    .ui-button,
    #connect,
    #start,
    #mode-options-toggle,
    #player-preferences > button,
    #end-game {
      border-radius: var(--mk-pill) !important;
    }

    button:not(.board-cell):hover,
    .ui-button:hover {
      transform: translateY(-1px) !important;
      filter: brightness(1.02) !important;
    }

    #connect,
    #start,
    #word-submit {
      background: var(--mk-orange) !important;
      color: #fffaf3 !important;
      border-color: rgba(185, 92, 36, 0.28) !important;
    }

    #connect {
      min-width: 7.6rem !important;
      min-height: 2.7rem !important;
      padding-inline: 1.2rem !important;
    }

    #start {
      width: 100% !important;
      min-height: 3.6rem !important;
      font-size: 1.08rem !important;
      justify-content: center !important;
    }

    #start::before {
      content: "⚂";
      margin-right: 0.55rem;
      font-size: 1.1rem;
    }

    #mode-options-toggle {
      min-height: 2.75rem !important;
      padding: 0 1.1rem !important;
      background: #fff6df !important;
      border-color: var(--mk-line) !important;
      color: var(--mk-ink) !important;
      justify-content: space-between !important;
      width: 100% !important;
    }

    #mode-options-toggle::before {
      content: "⚙";
      margin-right: 0.55rem;
      opacity: 0.82;
    }

    #player-preferences > button {
      min-height: 2.7rem !important;
      padding-inline: 1.2rem !important;
      background: #fff5e1 !important;
      color: var(--mk-ink) !important;
      border-color: var(--mk-line) !important;
    }

    #player-preferences > button::before {
      content: "⚙ ";
    }

    #status.connected-badge,
    #status {
      min-height: 2.4rem !important;
      padding: 0 1rem !important;
      background: var(--mk-green-soft) !important;
      color: #4d762c !important;
      border-color: rgba(101, 150, 58, 0.24) !important;
      border-radius: var(--mk-pill) !important;
    }

    #status.connected-badge::before {
      content: "●";
      margin-right: 0.45rem;
      color: #61a80f;
    }

    #boggle-layout {
      display: grid !important;
      grid-template-columns: minmax(16rem, 23rem) minmax(30rem, 46rem) minmax(16rem, 23rem) !important;
      gap: 0.95rem !important;
      align-items: start !important;
      justify-content: center !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {

      min-width: 0 !important;
    }
    #boggle-left,
    #boggle-right {
      display: flex !important;
    }
    #boggle-left,
    #boggle-right {
      flex-direction: column !important;
    }
    #boggle-left,
    #boggle-right {
      gap: 0.95rem !important;
    }

    #boggle-left {
      min-height: 0 !important;
    }

    #launch-panel {
      padding: 0.85rem !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0.65rem !important;
      background: #fff8e8 !important;
    }

    #launch-panel > h2 {
      display: none !important;
    }

    #mode-controls {
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    #mode-options-body {
      background: #fffaf0 !important;
      border: 1px solid var(--mk-line) !important;
      border-radius: 1rem !important;
      padding: 0.85rem !important;
      margin-top: 0.65rem !important;
    }

    #play-status-panel {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto auto !important;
      align-items: center !important;
      gap: 0.75rem !important;
      padding: 0.9rem 1rem !important;
      background: #fff8e8 !important;
    }

    #play-status-panel > h2 {
      display: block !important;
      grid-column: 1 / 2 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      font-size: 1.25rem !important;
      color: var(--mk-ink) !important;
    }

    #play-status-panel > h2::before {
      content: "🎮 ";
      font-size: 1rem;
    }

    #game-status {
      justify-self: start !important;
      min-height: 2.25rem !important;
      padding: 0 0.9rem !important;
      border-radius: var(--mk-pill) !important;
      background: #fffaf0 !important;
      color: var(--mk-ink) !important;
      border: 1px solid var(--mk-line) !important;
      font-weight: 950 !important;
    }

    #timer {
      justify-self: end !important;
      min-height: 2.9rem !important;
      padding: 0 1.25rem !important;
      background: var(--mk-yellow) !important;
      border: 1px solid rgba(168, 132, 43, 0.24) !important;
      border-radius: var(--mk-pill) !important;
      color: #5d351e !important;
      font-size: 1.28rem !important;
      font-weight: 950 !important;
    }

    #timer::before {
      content: "⏱";
      margin-right: 0.45rem;
    }

    #end-game {
      min-height: 2.9rem !important;
      padding: 0 1.25rem !important;
      background: var(--mk-red) !important;
      border-color: rgba(180, 63, 53, 0.24) !important;
      color: white !important;
    }

    #board {

      padding: 0.95rem !important;
      gap: 0.65rem !important;
      border-radius: 1.55rem !important;
      background: #e7c47a !important;
      border: 1px solid rgba(143, 99, 49, 0.2) !important;
      box-shadow: 0 0.5rem 1rem rgba(103, 71, 38, 0.09) !important;
    }

    #board .board-cell {
      min-height: clamp(4.4rem, 8vw, 7rem) !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 1rem !important;
      border: 1px solid rgba(111, 73, 40, 0.12) !important;
      background: #fff7df !important;
      color: #5a321b !important;
      box-shadow: none !important;
    }

    #board .board-letter {
      font-size: clamp(1.9rem, 4.3vw, 3.6rem) !important;
      color: #5a321b !important;
      font-weight: 950 !important;
      line-height: 1 !important;
    }

    #board .board-cell::before {
      content: "";
      position: absolute;
      left: 0.7rem;
      top: 0.7rem;
      width: 0.32rem;
      height: 0.32rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.85);
      pointer-events: none;
    }

    #board .board-cell::after {
      content: "";
      position: absolute;
      right: 0.7rem;
      bottom: 0.7rem;
      width: 0.32rem;
      height: 0.32rem;
      border-radius: 999px;
      background: rgba(218, 178, 102, 0.25);
      pointer-events: none;
    }

    #word-form {

      box-sizing: border-box !important;

      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      gap: 0.8rem !important;
      align-items: center !important;

    }

    #word-input {
      min-height: 3.45rem !important;

      border: 1px solid var(--mk-line) !important;
      background: #fffaf0 !important;
      padding: 0 1.3rem !important;
      font-size: 1.18rem !important;
      color: var(--mk-ink) !important;
      box-shadow: none !important;
    }

    #word-submit {
      min-height: 3.45rem !important;
      min-width: 11rem !important;
      padding: 0 1.6rem !important;
      font-size: 1.08rem !important;

    }

    #word-submit::before {
      content: "✓";
      margin-right: 0.55rem;
      font-size: 1.2rem;
    }

    #word-feedback {

      color: var(--mk-ink) !important;
      font-weight: 850 !important;
    }

    #players-panel {
      min-height: 11rem !important;
    }

    #found-words-panel {
      min-height: 24rem !important;
      flex: 1 1 auto !important;
    }

    #players-panel > h2,
    #found-words-panel > h2,
    #help-panel > h2 {
      margin: 0 0 0.85rem !important;
      padding-bottom: 0.65rem !important;
      border-bottom: 1px solid var(--mk-line) !important;
      color: var(--mk-ink) !important;

      font-weight: 950 !important;
    }
    #help-panel > h2 {
      font-size: 1.2rem !important;
    }

    #players-panel > h2::before { content: "👥 "; }
    #found-words-panel > h2::before { content: "📖 "; }
    #help-panel > h2::before { content: "💡 "; }

    #players {
      --player-row-height: 2.75rem !important;
      --player-row-gap: 0.38rem !important;
      height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3)) !important;
      max-height: calc((var(--player-row-height) * 4) + (var(--player-row-gap) * 3)) !important;
    }

    .players-scroll-list {
      gap: var(--player-row-gap) !important;
    }

    .player-row {
      height: var(--player-row-height) !important;
      border-radius: 0.95rem !important;
      padding: 0.35rem 0.55rem !important;
      background: #fff4d5 !important;
      border: 1px solid rgba(111, 73, 40, 0.08) !important;
    }

    .player-row:nth-child(2) {
      background: #fff8e8 !important;
    }

    .player-row:nth-child(3) {
      background: #fff8e8 !important;
    }

    .player-row:nth-child(4) {
      background: #fff8e8 !important;
    }

    .player-rank {
      width: 1.65rem !important;
      min-width: 1.65rem !important;
      height: 1.65rem !important;
      border-radius: 999px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: var(--mk-yellow) !important;
      border: 1px solid rgba(111, 73, 40, 0.12) !important;
      color: var(--mk-ink) !important;
      font-weight: 950 !important;
      opacity: 1 !important;
    }

    .player-score-line {
      font-size: 0.86rem !important;
      color: var(--mk-ink) !important;
      font-weight: 850 !important;
    }

    #found-words {
      display: block !important;
      font-size: 0.95rem !important;
      line-height: 1.7 !important;
      padding-right: 0.5rem !important;
      color: var(--mk-ink) !important;
    }

    .found-word-chip {
      display: inline-block !important;
      margin: 0 0.55rem 0.22rem 0 !important;
      color: var(--mk-ink) !important;
      font-weight: 850 !important;
    }

    #help-slot {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.95rem !important;
      max-height: none !important;
      overflow: visible !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    #help-panel {
      min-height: 18rem !important;
      background: var(--mk-panel) !important;
    }

    #help-panel > * {
      color: var(--mk-ink) !important;
    }

    #rules-summary {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.8rem !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    #rules-summary[hidden] {
      display: none !important;
    }

    #rules-summary .rule-pill {
      width: 100% !important;
      min-height: 5.7rem !important;
      justify-content: flex-start !important;
      align-items: flex-start !important;
      white-space: normal !important;
      text-align: left !important;
      box-sizing: border-box !important;
      padding: 1rem 1.1rem !important;
      border-radius: 1.25rem !important;
      font-size: 1rem !important;
      line-height: 1.35 !important;
      box-shadow: var(--mk-shadow) !important;
    }

    #rules-summary .rule-pill::before {
      margin-right: 0.65rem !important;
      font-size: 1.4rem !important;
      line-height: 1 !important;
    }

    .rule-pill-danger {
      background: var(--mk-green-soft) !important;
      border-color: rgba(96, 147, 64, 0.22) !important;
      color: #3f6c2a !important;
    }

    .rule-pill-danger::before {
      content: "✨";
    }

    .rule-pill-warning {
      background: var(--mk-red-soft) !important;
      border-color: rgba(224, 93, 81, 0.22) !important;
      color: #a94338 !important;
    }

    .rule-pill-warning::before {
      content: "!";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 999px;
      background: var(--mk-red);
      color: white;
      font-weight: 950;
    }

    #welcome-panel {
      background: var(--mk-panel) !important;
    }

    #player-preferences-body {
      background: var(--mk-panel) !important;
      border-radius: 1.2rem !important;
      border-color: var(--mk-line) !important;
    }

    @media (max-width: 78rem) {
      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #boggle-brand {
        min-width: 0 !important;
      }

    }

    /* Ancienne couche : injectMockupCloserThemeV2. */
    /* Passe v2 : on force une structure plus proche de la maquette. */

    #boggle-shell {
      width: min(100%, 99rem) !important;
      padding-top: 0.9rem !important;
    }

    #boggle-top {
      width: min(100%, 64rem) !important;
      margin-inline: auto !important;

      padding: 0.55rem 0.85rem !important;
      border-radius: 1.4rem !important;
    }

    #boggle-brand {
      min-width: 10rem !important;
      padding-right: 0.5rem !important;
    }

    .boggle-brand-mark {
      font-size: clamp(2.05rem, 3vw, 2.8rem) !important;
    }

    #connection-controls {

      grid-template-columns: minmax(8rem, 12rem) minmax(8rem, 12rem) auto auto minmax(6rem, 1fr) auto !important;
      align-items: center !important;
      gap: 0.55rem !important;
    }

    #room,
    #name {
      width: 100% !important;
      box-sizing: border-box !important;
    }

    #player-preferences {
      grid-column: 6 !important;
      justify-self: end !important;
      margin-left: 0 !important;
    }

    #boggle-layout {
      grid-template-columns: minmax(17rem, 21rem) minmax(32rem, 43rem) minmax(17rem, 21rem) !important;
      align-items: start !important;
      gap: 0.9rem !important;
    }

    #launch-panel {
      gap: 0.7rem !important;
      padding: 0.8rem !important;
    }

    #start,
    #mode-options-toggle,
    #connect,
    #status,
    #end-game,
    #word-submit,
    #player-preferences > button {

      background-image: none !important;
      box-shadow: none !important;
    }
    #start,
    #mode-options-toggle,
    #connect,
    #status,
    #end-game,
    #player-preferences > button {
      border-radius: 9999px !important;
    }

    #start {
      min-height: 3.25rem !important;
      font-size: 1.08rem !important;
      background: #f07f32 !important;
      color: #fff8ed !important;
    }

    #mode-options-toggle {
      min-height: 2.75rem !important;
      background: #fff5dc !important;
      border: 1px solid rgba(111, 73, 40, 0.2) !important;
      color: #5d351e !important;
      justify-content: center !important;
      padding-inline: 1rem !important;
    }

    #mode-options-toggle::after {
      margin-left: auto !important;
    }

    #play-status-panel {
      display: grid !important;
      grid-template-columns: minmax(8rem, 1fr) auto auto auto !important;
      grid-template-rows: auto !important;
      gap: 0.75rem !important;
      align-items: center !important;
      min-height: 4.25rem !important;
      padding: 0.85rem 1rem !important;
      border-radius: 1.35rem !important;
    }

    #play-status-panel > h2 {
      display: block !important;
      grid-column: 1 !important;
      grid-row: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      font-size: 1.25rem !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
    }

    #game-status {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      min-height: 2.45rem !important;
      padding-inline: 1rem !important;
      border-radius: 9999px !important;
      background: #fff8ed !important;
      font-size: 0.94rem !important;
    }

    #timer {
      grid-column: 3 !important;
      grid-row: 1 !important;
      min-height: 2.65rem !important;
      padding-inline: 1rem !important;
      border-radius: 9999px !important;
      background: #f5d872 !important;
      white-space: nowrap !important;
    }

    #end-game {
      grid-column: 4 !important;
      grid-row: 1 !important;
      min-height: 2.7rem !important;
      min-width: 10rem !important;
      padding-inline: 1.25rem !important;
      background: #ef6255 !important;
      color: white !important;
      border-color: rgba(176, 58, 47, 0.25) !important;
      white-space: nowrap !important;
    }

    #board {

      gap: 0.58rem !important;
      padding: 0.85rem !important;
    }

    #board .board-cell {
      min-height: clamp(4.5rem, 7vw, 6.45rem) !important;
      border-radius: 0.95rem !important;
    }

    #word-form {

      grid-template-columns: minmax(0, 1fr) minmax(9.5rem, auto) !important;

      gap: 0.7rem !important;
    }

    #word-input {
      min-height: 3.4rem !important;
      font-size: 1.08rem !important;

    }

    #word-submit {
      min-height: 3.4rem !important;
      min-width: 10rem !important;

    }

    #boggle-right {
      min-height: 0 !important;
    }

    #help-slot {
      display: none !important;
    }

    #mockup-right-cards {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.85rem !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    .mockup-info-card {
      border: 1px solid rgba(111, 73, 40, 0.16) !important;
      border-radius: 1.3rem !important;
      background: #fff8e8 !important;
      color: #5d351e !important;
      padding: 1rem !important;
      box-shadow: 0 0.35rem 1rem rgba(97, 65, 35, 0.08) !important;
      box-sizing: border-box !important;
    }

    .mockup-info-card h2 {
      display: grid !important;
      grid-template-columns: auto 1fr auto !important;
      align-items: center !important;
      gap: 0.65rem !important;
      margin: 0 0 0.75rem !important;
      padding-bottom: 0.65rem !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.14) !important;
      font-size: 1.25rem !important;
      line-height: 1.1 !important;
      color: #5d351e !important;
      font-weight: 950 !important;
    }

    .mockup-info-card p {
      margin: 0 !important;
      color: #6e5038 !important;
      font-weight: 650 !important;
      line-height: 1.38 !important;
    }

    .mockup-info-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 2.15rem !important;
      height: 2.15rem !important;
      border-radius: 9999px !important;
      background: #ffeeb5 !important;
      font-size: 1.25rem !important;
    }

    .mockup-info-question {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 1.55rem !important;
      height: 1.55rem !important;
      border-radius: 9999px !important;
      background: rgba(111, 73, 40, 0.22) !important;
      color: #fffaf0 !important;
      font-size: 0.9rem !important;
      font-weight: 950 !important;
    }

    .mockup-help-list {
      display: grid !important;
      gap: 0.7rem !important;
      margin: 0.85rem 0 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }

    .mockup-help-list li {
      display: grid !important;
      grid-template-columns: 2.2rem 1fr !important;
      gap: 0.7rem !important;
      align-items: center !important;
      color: #6e5038 !important;
      line-height: 1.3 !important;
      font-weight: 650 !important;
    }

    .mockup-help-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 2.1rem !important;
      height: 2.1rem !important;
      border-radius: 0.7rem !important;
      background: #fff0bb !important;
      color: #d97824 !important;
      font-weight: 950 !important;
    }

    .unique-card {
      background: #e7f4d6 !important;
      border-color: rgba(100, 153, 68, 0.22) !important;
    }

    .unique-card .mockup-info-icon {
      background: #cfe7b7 !important;
      color: #4f7b30 !important;
    }

    .unique-card h2,
    .unique-card p {
      color: #3f6c2a !important;
    }

    .penalty-card {
      background: #ffe0d8 !important;
      border-color: rgba(224, 93, 81, 0.22) !important;
    }

    .penalty-card .mockup-info-icon {
      background: #ef6255 !important;
      color: white !important;
      font-weight: 950 !important;
    }

    .penalty-card h2,
    .penalty-card p {
      color: #a94338 !important;
    }

    #players-panel,
    #found-words-panel {
      min-height: auto !important;
    }

    #players-panel {
      height: 13.4rem !important;
    }

    #found-words-panel {
      height: 24rem !important;
    }

    #players-panel > h2,
    #found-words-panel > h2 {

      padding-bottom: 0.65rem !important;

    }

    #players {
      --player-row-height: 2.45rem !important;
      --player-row-gap: 0.32rem !important;
    }

    .player-row {
      border-radius: 0.85rem !important;
    }

    .player-rank {
      border-radius: 9999px !important;
    }

    @media (max-width: 78rem) {

      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #mockup-right-cards {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)) !important;
      }

      #play-status-panel {
        grid-template-columns: 1fr auto !important;
      }

      #game-status,
      #timer,
      #end-game {
        grid-column: auto !important;
      }
    }

    /* Ancienne couche : injectMockupCloserThemeV3. */
    /* V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau. */

    :root {
      --mk-cute-font: "Comic Sans MS", "Trebuchet MS", "Arial Rounded MT Bold", "Avenir Next Rounded", "Segoe UI", system-ui, sans-serif;
    }

    html,
    body,
    button,
    input,
    select,
    textarea {
      font-family: var(--mk-cute-font) !important;
    }

    body {
      font-weight: 650 !important;
    }

    #boggle-shell {
      width: min(100%, 100rem) !important;
      padding: 0.85rem 1.1rem 1.3rem !important;
    }

    #boggle-top {
      width: min(100%, 72rem) !important;
      margin: 0 auto 0.95rem !important;
      padding: 0.25rem 0.35rem !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      border-radius: 0 !important;

    }

    #boggle-brand {
      min-width: 10.8rem !important;
      padding: 0 !important;
      filter: drop-shadow(0 0.08rem 0 rgba(255, 245, 220, 0.95));
    }

    .boggle-brand-mark {
      font-family: var(--mk-cute-font) !important;
      font-size: clamp(2.35rem, 3.25vw, 3.35rem) !important;
      line-height: 0.9 !important;
      font-weight: 950 !important;
      color: #7b3f16 !important;
      letter-spacing: -0.06em !important;
    }

    .boggle-brand-dots {
      margin-left: 0.1rem !important;
    }

    #connection-controls {

      grid-template-columns: minmax(9rem, 13rem) minmax(9rem, 13rem) auto auto 1fr auto !important;
      gap: 0.7rem !important;
      align-items: center !important;

    }

    .connection-field-label {
      font-size: 0.92rem !important;
      font-weight: 950 !important;
      color: #6b3b1f !important;
      padding-left: 0.25rem !important;
      margin-bottom: 0.08rem !important;
    }

    #room,
    #name {
      min-height: 2.55rem !important;
      border-radius: 9999px !important;
      background: rgba(255, 249, 235, 0.9) !important;
      border: 1px solid rgba(123, 83, 47, 0.2) !important;
      box-shadow: none !important;
      font-size: 1rem !important;
      padding: 0 1rem !important;
    }

    #connect,
    #status,
    #player-preferences > button {
      min-height: 2.75rem !important;
      border-radius: 9999px !important;

      font-size: 1rem !important;
      box-shadow: none !important;
    }
    #connect,
    #player-preferences > button {
      padding-inline: 1.25rem !important;
    }

    #player-preferences > button {
      background: rgba(255, 246, 225, 0.76) !important;
      border: 1px solid rgba(123, 83, 47, 0.22) !important;
    }

    #boggle-layout {
      grid-template-columns: minmax(17rem, 22rem) minmax(34rem, 43rem) minmax(18rem, 22rem) !important;
      gap: 0.9rem !important;
    }

    #play-status-panel {
      grid-template-columns: minmax(8rem, 1fr) auto auto auto !important;
      background: #fff8e8 !important;
      border-radius: 1.35rem !important;
      align-items: center !important;
    }

    #play-status-panel > h2 {
      font-size: 1.36rem !important;
      color: #5d351e !important;
      letter-spacing: -0.02em !important;
    }

    #game-status {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      min-height: auto !important;
      color: #7c6048 !important;
      font-size: 1rem !important;
      font-weight: 850 !important;
      border-radius: 0 !important;
      justify-self: start !important;
    }

    #game-status::before {
      content: "•";
      margin-right: 0.35rem;
      color: #f07f32;
      font-weight: 950;
    }

    #timer {
      min-height: 2.8rem !important;
      padding-inline: 1.05rem !important;
      border-radius: 9999px !important;
      box-shadow: none !important;
    }

    #end-game {
      min-height: 2.85rem !important;
      min-width: 11rem !important;
      border-radius: 9999px !important;
      box-shadow: none !important;
    }

    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #play-status-panel,
    #launch-panel {
      box-shadow: 0 0.3rem 0.85rem rgba(97, 65, 35, 0.07) !important;
    }

    #found-words {
      display: block !important;
      overflow-y: auto !important;
      padding-right: 0.45rem !important;
    }

    .found-words-table {
      display: grid !important;

      width: 100% !important;
      row-gap: 0 !important;
      column-gap: 0 !important;
      font-size: 0.98rem !important;
      color: #5d351e !important;
    }

    .found-words-header-cell {

      border-bottom: 1px solid rgba(111, 73, 40, 0.12) !important;
    }

    .found-words-header-cell:first-child {
      border-top-left-radius: 0.8rem !important;
      border-bottom-left-radius: 0.8rem !important;
    }

    .found-words-header-cell:nth-child(3) {
      border-top-right-radius: 0.8rem !important;
      border-bottom-right-radius: 0.8rem !important;
    }

    .found-words-word,
    .found-words-points,
    .found-words-player {

      border-bottom: 1px solid rgba(111, 73, 40, 0.07) !important;
      box-sizing: border-box !important;
    }
    .found-words-word,
    .found-words-player {
      min-height: 2rem !important;
    }
    .found-words-player {
      display: inline-flex !important;
    }
    .found-words-player {
      align-items: center !important;
    }
    .found-words-player {
      padding: 0.28rem 0.5rem !important;
    }

    .found-words-word {

      font-weight: 950 !important;
    }

    .found-words-points,
    .found-words-player {
      color: #7a5b40 !important;

    }
    .found-words-player {
      font-weight: 750 !important;
    }

    .found-word-dot {

      flex: 0 0 auto !important;

    }

    .found-word-dot-0 { background: #f7b21b !important; }
    .found-word-dot-1 { background: #ef6255 !important; }
    .found-word-dot-2 { background: #62b64b !important; }
    .found-word-dot-3 { background: #8f4dd7 !important; }
    .found-word-dot-4 { background: #f08a31 !important; }
    .found-word-dot-5 { background: #49a6d8 !important; }

    .found-words-empty-row {

      font-weight: 750 !important;
      font-style: italic !important;
    }

    .mockup-help-list li {
      font-size: 0.96rem !important;
    }

    #word-input {
      min-height: 3.55rem !important;

    }

    #word-submit {
      min-height: 3.55rem !important;

    }

    @media (max-width: 78rem) {
      #boggle-top {
        width: 100% !important;

      }

    }

    /* Ancienne couche : injectMockupCloserThemeV4. */
    /*
     * V4 : rapprochement plus fort de la maquette.
     * Police plus ronde, top bar posée sur le fond, panneaux plus larges et tableau des mots plus propre.
     */
    :root {
      --cute-font: "Fredoka", "Nunito", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif;
      --cute-logo-font: "Fredoka", "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif;
      --cream: #fbf1da;
      --cream-strong: #fff8e8;
      --cream-soft: #fff3cf;
      --brown: #6e3d1d;
      --brown-dark: #4f2a17;
      --brown-muted: #8a6447;
      --orange: #f47f2f;
      --orange-dark: #e37027;
      --yellow: #f6d86b;
      --yellow-soft: #fff0b7;
      --green: #80b84f;
      --green-soft: #e3f1cc;
      --red: #ef6358;
      --red-soft: #ffe0d9;
      --line-soft: rgba(111, 73, 40, 0.16);
      --panel-radius: 1.55rem;
      --button-radius: 9999px;
      --soft-shadow: 0 0.45rem 1rem rgba(104, 73, 40, 0.075);
    }

    html,
    body,
    button,
    input,
    select,
    textarea {
      font-family: var(--cute-font) !important;
    }

    body {
      color: var(--brown-dark) !important;
      font-size: 16px !important;
      letter-spacing: 0.002em !important;
    }

    #boggle-shell {
      width: min(100%, 104rem) !important;
      padding: 0.7rem 1.2rem 1.4rem !important;
    }

    /*
     * Top sans carte : on pose les éléments sur le fond.
     */
    #boggle-top {
      width: min(100%, 82rem) !important;
      margin: 0 auto 1.05rem !important;
      padding: 0.25rem 0.15rem !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      column-gap: 1.6rem !important;
    }

    #boggle-brand {
      min-width: 13rem !important;
      padding: 0 !important;
      transform: translateY(-0.05rem) rotate(-1.5deg) !important;
    }

    .boggle-brand-mark {
      font-family: var(--cute-logo-font) !important;
      font-size: clamp(2.8rem, 4.6vw, 4.4rem) !important;
      font-weight: 700 !important;
      line-height: 0.9 !important;
      letter-spacing: -0.075em !important;
      color: #7c3f15 !important;
      text-shadow:
        0 0.13rem 0 #fff0c4,
        0.06rem 0.06rem 0 rgba(79, 42, 23, 0.1) !important;
    }

    .boggle-brand-dots {
      grid-template-columns: repeat(2, 0.62rem) !important;
      gap: 0.22rem !important;
      margin-left: 0.15rem !important;
      transform: rotate(-12deg) translateY(-0.45rem) !important;
    }

    .brand-dot {
      width: 0.62rem !important;
      height: 0.62rem !important;
    }

    #connection-controls {

      grid-template-columns: minmax(10rem, 14rem) minmax(10rem, 14rem) auto auto 1fr auto !important;
      gap: 0.85rem !important;
      align-items: center !important;
    }

    .connection-control {
      gap: 0.18rem !important;
    }

    .connection-field-label {
      font-size: 1.02rem !important;
      font-weight: 700 !important;
      color: var(--brown) !important;
      padding-left: 0.75rem !important;
      line-height: 1 !important;
    }

    #room,
    #name {
      height: 2.75rem !important;
      border-radius: var(--button-radius) !important;
      background: rgba(255, 248, 232, 0.92) !important;
      border: 2px solid rgba(111, 73, 40, 0.14) !important;
      box-shadow: inset 0 0.08rem 0 rgba(255, 255, 255, 0.9) !important;
      padding: 0 1.05rem !important;
      color: var(--brown-dark) !important;
      font-size: 1.04rem !important;
      font-weight: 600 !important;
    }

    #connect {
      height: 3rem !important;
      min-height: 3rem !important;
      padding-inline: 1.65rem !important;
      background: var(--orange) !important;
      border: 2px solid rgba(182, 88, 34, 0.16) !important;
      color: white !important;
      font-size: 1.06rem !important;
      font-weight: 700 !important;
    }

    #status {
      height: 2.8rem !important;
      min-height: 2.8rem !important;

      background: var(--green-soft) !important;
      border: 2px solid rgba(103, 157, 70, 0.15) !important;
      color: #4f7b2e !important;
      font-weight: 700 !important;
      font-size: 1rem !important;
    }

    #player-preferences > button {
      height: 3rem !important;
      min-height: 3rem !important;
      padding: 0 1.45rem !important;
      background: rgba(255, 247, 227, 0.72) !important;
      border: 2px solid rgba(111, 73, 40, 0.18) !important;
      color: var(--brown) !important;
      font-size: 1.06rem !important;
      font-weight: 700 !important;
    }

    #boggle-layout {
      grid-template-columns: minmax(18.5rem, 24.5rem) minmax(37rem, 49rem) minmax(19rem, 24.5rem) !important;
      gap: 1.05rem !important;
      justify-content: center !important;
    }

    .boggle-column > section,
    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #launch-panel,
    #play-status-panel,
    #welcome-panel {
      border-radius: var(--panel-radius) !important;
    }
    .boggle-column > section,
    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #launch-panel,
    #play-status-panel,
    #welcome-panel {
      background: rgba(255, 248, 232, 0.94) !important;
    }
    .boggle-column > section,
    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #launch-panel,
    #play-status-panel,
    #welcome-panel {
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
    }
    .boggle-column > section,
    #players-panel,
    #found-words-panel,
    #mockup-right-cards .mockup-info-card,
    #launch-panel,
    #play-status-panel,
    #welcome-panel {
      box-shadow: var(--soft-shadow) !important;
    }

    #launch-panel {
      padding: 0.95rem !important;
      gap: 0.72rem !important;
    }

    #start {
      height: 3.75rem !important;
      min-height: 3.75rem !important;
      border-radius: var(--button-radius) !important;
      font-size: 1.22rem !important;
      font-weight: 700 !important;
      background: var(--orange) !important;
      border: 0 !important;
      color: #fff9ef !important;
    }

    #mode-options-toggle {
      height: 3.1rem !important;
      min-height: 3.1rem !important;
      border-radius: var(--button-radius) !important;
      background: rgba(255, 247, 226, 0.92) !important;
      border: 2px solid rgba(111, 73, 40, 0.13) !important;
      color: var(--brown) !important;
      font-size: 1.05rem !important;
      font-weight: 700 !important;
    }

    /*
     * Barre Partie plus proche de la capture : titre + sous-texte intégré,
     * aucun badge visible autour de “Partie en cours”.
     */
    #play-status-panel {
      grid-template-columns: minmax(13rem, 1fr) auto auto !important;
      gap: 1rem !important;
      min-height: 5.3rem !important;
      padding: 1rem 1.15rem !important;
      align-items: center !important;
      background: rgba(255, 248, 232, 0.96) !important;
    }

    #play-status-panel > h2 {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      grid-template-rows: auto auto !important;
      column-gap: 0.7rem !important;
      align-items: center !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      color: var(--brown-dark) !important;
      font-size: 1.58rem !important;
      font-weight: 700 !important;
      letter-spacing: -0.035em !important;
      line-height: 1 !important;
    }

    #play-status-panel > h2::before {
      content: "🎮" !important;
      grid-row: 1 / span 2 !important;
      font-size: 1.55rem !important;
      transform: translateY(0.08rem) !important;
    }

    #play-status-panel > h2::after {
      content: "Trouvez un maximum de mots !" !important;
      grid-column: 2 !important;
      grid-row: 2 !important;
      color: var(--brown-muted) !important;
      font-size: 1.02rem !important;
      font-weight: 500 !important;
      letter-spacing: 0 !important;
      margin-top: 0.18rem !important;
    }

    #game-status {
      grid-column: 1 !important;
      grid-row: 1 !important;
      align-self: end !important;
      justify-self: start !important;
      transform: translate(2.65rem, 1.25rem) !important;
      display: inline-flex !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      color: var(--brown-muted) !important;
      font-size: 0.98rem !important;
      font-weight: 600 !important;
      line-height: 1 !important;
    }

    #game-status::before {
      content: "" !important;
      margin: 0 !important;
    }

    #timer {
      grid-column: 2 !important;
      min-height: 3.05rem !important;
      height: 3.05rem !important;
      padding: 0 1.22rem !important;
      border-radius: var(--button-radius) !important;
      background: var(--yellow) !important;
      color: var(--brown-dark) !important;
      border: 2px solid rgba(158, 118, 37, 0.12) !important;
      font-size: 1.32rem !important;
      font-weight: 700 !important;
    }

    #end-game {
      grid-column: 3 !important;
      height: 3.1rem !important;
      min-height: 3.1rem !important;
      min-width: 12rem !important;
      border-radius: var(--button-radius) !important;
      background: var(--red) !important;
      color: white !important;
      border: 0 !important;
      font-size: 1.05rem !important;
      font-weight: 700 !important;
    }

    #board {

      padding: 1.05rem !important;
      gap: 0.72rem !important;
      border-radius: 1.75rem !important;
      background: #e8c36f !important;
      border: 2px solid rgba(139, 92, 38, 0.11) !important;
    }

    #board .board-cell {
      min-height: clamp(5rem, 7.1vw, 7.2rem) !important;
      border-radius: 1.18rem !important;
      background: #fff6df !important;
      border: 2px solid rgba(111, 73, 40, 0.08) !important;
    }

    #board .board-letter {
      font-family: var(--cute-font) !important;
      font-size: clamp(2.15rem, 4.3vw, 3.85rem) !important;
      font-weight: 700 !important;
      color: #5c2f17 !important;
      letter-spacing: -0.03em !important;
    }

    #word-form {

      grid-template-columns: minmax(0, 1fr) minmax(10.5rem, auto) !important;
      gap: 0.85rem !important;

    }

    #word-input {
      height: 3.75rem !important;
      min-height: 3.75rem !important;

      padding-inline: 1.35rem !important;
      font-size: 1.17rem !important;
      font-weight: 500 !important;
    }

    #word-submit {
      height: 3.75rem !important;
      min-height: 3.75rem !important;
      min-width: 11.5rem !important;

      background: var(--orange) !important;
      border: 0 !important;
      font-size: 1.16rem !important;
      font-weight: 700 !important;
    }

    #players-panel,
    #found-words-panel {
      padding: 1rem !important;
    }

    #players-panel > h2,
    #found-words-panel > h2,
    .mockup-info-card h2 {

      font-weight: 700 !important;

      color: var(--brown-dark) !important;
    }
    .mockup-info-card h2 {
      font-size: 1.42rem !important;
    }
    .mockup-info-card h2 {
      letter-spacing: -0.035em !important;
    }

    #players-panel {
      height: 15.4rem !important;
    }

    #found-words-panel {
      height: 29rem !important;
    }

    .found-words-table {

      font-size: 1.02rem !important;
      border-radius: 1rem !important;
      overflow: hidden !important;
    }

    .found-words-header-cell {

      font-size: 1.02rem !important;

    }

    .found-words-word,
    .found-words-player {
      min-height: 2.35rem !important;
    }
    .found-words-player {
      padding: 0.36rem 0.6rem !important;
    }
    .found-words-points,
    .found-words-player {
      background: rgba(255, 250, 239, 0.54) !important;
    }

    .found-words-word strong {
      font-weight: 700 !important;

    }

    .found-words-empty-row {

      font-weight: 500 !important;
      line-height: 1.45 !important;
    }

    #mockup-right-cards {
      gap: 1rem !important;
    }

    .mockup-info-card {
      padding: 1.08rem !important;
      border-radius: 1.55rem !important;
    }

    .mockup-info-card h2 {
      margin-bottom: 0.85rem !important;
      padding-bottom: 0.75rem !important;
    }

    .mockup-info-card p,
    .mockup-help-list li {
      font-size: 1.02rem !important;
      line-height: 1.4 !important;
      font-weight: 500 !important;
    }

    .mockup-info-icon {
      width: 2.35rem !important;
      height: 2.35rem !important;
      font-size: 1.32rem !important;
    }

    .mockup-help-list {
      gap: 0.78rem !important;
    }

    .mockup-help-icon {
      width: 2.25rem !important;
      height: 2.25rem !important;
    }

    @media (max-width: 86rem) {
      #boggle-layout {
        grid-template-columns: minmax(16rem, 21rem) minmax(32rem, 42rem) minmax(16rem, 21rem) !important;
      }

      #boggle-top {
        width: min(100%, 74rem) !important;
      }
    }

    @media (max-width: 78rem) {

      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #game-status {
        transform: none !important;
      }
    }

    /* Ancienne couche : injectMockupFullWidthThemeV5. */
    /*
     * V5 : pleine largeur + centre plus unifié.
     * But : moins de cartes empilées, plus proche de la maquette générée.
     */

    body {
      overflow-x: hidden !important;
    }

    #boggle-shell {
      width: calc(100vw - 2rem) !important;
      max-width: 108rem !important;
      margin: 0 auto !important;
      padding: 0.8rem 0 1.4rem !important;
      box-sizing: border-box !important;
    }

    #boggle-top {
      width: 100% !important;
      max-width: none !important;
      margin: 0 auto 1rem !important;
      padding: 0.15rem 0.65rem !important;
      box-sizing: border-box !important;
    }

    #connection-controls {
      grid-template-columns:
        minmax(10rem, 14rem)
        minmax(10rem, 14rem)
        auto
        auto
        minmax(1rem, 1fr)
        auto !important;
    }

    #boggle-layout {
      width: 100% !important;
      max-width: none !important;
      display: grid !important;
      grid-template-columns:
        minmax(18rem, 0.92fr)
        minmax(38rem, 1.62fr)
        minmax(18rem, 0.92fr) !important;
      gap: clamp(0.9rem, 1.4vw, 1.35rem) !important;
      align-items: start !important;
      justify-content: stretch !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      width: 100% !important;
      min-width: 0 !important;
    }

    /*
     * On transforme le centre en grande zone de jeu continue.
     * Le plateau, la barre partie et la saisie semblent faire partie d’un même espace.
     */
    #boggle-center {
      position: relative !important;
      padding: 0.95rem !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      border-radius: 1.9rem !important;
      background:
        linear-gradient(180deg, rgba(255, 249, 232, 0.96), rgba(255, 244, 213, 0.92)) !important;
      box-shadow: 0 0.45rem 1rem rgba(104, 73, 40, 0.075) !important;
      box-sizing: border-box !important;
    }

    #boggle-center::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      background:
        radial-gradient(circle at 8% 20%, rgba(244, 127, 47, 0.08) 0 0.35rem, transparent 0.38rem),
        radial-gradient(circle at 91% 26%, rgba(128, 184, 79, 0.10) 0 0.45rem, transparent 0.48rem),
        radial-gradient(circle at 12% 74%, rgba(128, 184, 79, 0.08) 0 0.5rem, transparent 0.53rem),
        radial-gradient(circle at 88% 82%, rgba(244, 127, 47, 0.08) 0 0.34rem, transparent 0.37rem) !important;
      pointer-events: none !important;
    }

    #boggle-center > * {
      position: relative !important;
      z-index: 1 !important;
    }

    /*
     * Le bloc lancement reste en haut, mais avec moins d'effet carte.
     */
    #launch-panel {
      margin: 0 0 0.85rem !important;
      padding: 0.15rem 0 0.75rem !important;
      border: 0 !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.10) !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    #start {
      width: min(100%, 42rem) !important;
      margin: 0 auto !important;
      height: 3.55rem !important;
      min-height: 3.55rem !important;
    }

    #mode-controls {
      width: min(100%, 42rem) !important;
      margin: 0.7rem auto 0 !important;
    }

    /*
     * Barre Partie intégrée, sans carte/sous-zone nette.
     */
    #play-status-panel {
      grid-template-columns: minmax(15rem, 1fr) auto auto !important;
      gap: 1rem !important;
      margin: 0.15rem 0 0.8rem !important;
      padding: 0.3rem 0.1rem 0.55rem !important;
      min-height: 3.9rem !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      align-items: center !important;
    }

    #play-status-panel > h2 {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.65rem !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      font-size: 1.65rem !important;
      line-height: 1 !important;
    }

    #play-status-panel > h2::before {
      content: "🎮" !important;
      font-size: 1.45rem !important;
      transform: none !important;
    }

    #play-status-panel > h2::after {
      display: none !important;
      content: none !important;
    }

    #game-status {
      position: static !important;
      transform: none !important;
      grid-column: 1 !important;
      grid-row: auto !important;
      align-self: center !important;
      justify-self: start !important;
      margin-left: 3.1rem !important;
      margin-top: -0.35rem !important;
      display: block !important;
      background: transparent !important;
      border: 0 !important;
      padding: 0 !important;
      color: #8a6447 !important;
      font-size: 1.02rem !important;
      font-weight: 600 !important;
      box-shadow: none !important;
    }

    #game-status::before {
      content: "" !important;
    }

    #timer {
      grid-column: 2 !important;
      height: 3rem !important;
      min-height: 3rem !important;
      padding: 0 1.25rem !important;
      font-size: 1.28rem !important;
    }

    #end-game {
      grid-column: 3 !important;
      height: 3rem !important;
      min-height: 3rem !important;
      min-width: 12.5rem !important;
      padding: 0 1.35rem !important;
    }

    /*
     * Plateau agrandi pour occuper la largeur centrale.
     */
    #board {
      padding: clamp(0.9rem, 1vw, 1.15rem) !important;
      gap: clamp(0.55rem, 0.75vw, 0.82rem) !important;
      border-radius: 1.8rem !important;
      background: #e8c36f !important;
    }

    #board .board-cell {
      min-height: clamp(4.9rem, 6.9vw, 7.35rem) !important;
      border-radius: 1.15rem !important;
    }

    #word-form {

      grid-template-columns: minmax(0, 1fr) minmax(10.8rem, auto) !important;
    }

    #word-input {
      background: rgba(255, 250, 239, 0.92) !important;
      border: 2px solid rgba(111, 73, 40, 0.12) !important;
      height: 3.65rem !important;
    }

    #word-submit {
      height: 3.65rem !important;
      min-width: 11rem !important;
    }

    /*
     * Colonnes latérales plus hautes, pour mieux remplir l’écran.
     */
    #players-panel {
      height: clamp(13.5rem, 20vh, 17rem) !important;
    }

    #found-words-panel {
      height: clamp(27rem, 48vh, 36rem) !important;
    }

    #mockup-right-cards {
      gap: clamp(0.9rem, 1.2vw, 1.25rem) !important;
    }

    .mockup-info-card {
      padding: clamp(1rem, 1.1vw, 1.25rem) !important;
      border-radius: 1.6rem !important;
    }

    #mockup-help-card {
      min-height: clamp(18rem, 29vh, 24rem) !important;
    }

    #mockup-unique-card,
    #mockup-penalty-card {
      min-height: clamp(8.5rem, 14vh, 12rem) !important;
    }

    .mockup-info-card h2 {
      font-size: clamp(1.25rem, 1.35vw, 1.55rem) !important;
    }

    .mockup-info-card p,
    .mockup-help-list li {
      font-size: clamp(0.95rem, 1vw, 1.08rem) !important;
    }

    /*
     * Quand la largeur le permet, on se rapproche encore plus de la capture générée :
     * plus d’espace pour gauche/droite et un centre dominant.
     */
    @media (min-width: 100rem) {
      #boggle-layout {
        grid-template-columns:
          minmax(22rem, 0.95fr)
          minmax(44rem, 1.55fr)
          minmax(22rem, 0.95fr) !important;
      }

    }

    @media (max-width: 86rem) {
      #boggle-shell {
        width: calc(100vw - 1rem) !important;
      }

      #boggle-layout {
        grid-template-columns:
          minmax(16rem, 21rem)
          minmax(32rem, 43rem)
          minmax(16rem, 21rem) !important;
      }

      #boggle-center {
        padding: 0.8rem !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #boggle-center {
        max-width: 48rem !important;
        margin: 0 auto !important;
      }

      #play-status-panel {
        grid-template-columns: 1fr auto !important;
      }

      #end-game {
        grid-column: 1 / -1 !important;
        justify-self: start !important;
      }

      #game-status {
        margin-left: 0 !important;
        margin-top: 0.25rem !important;
      }
    }

    /* Ancienne couche : injectMockupFullWidthThemeV6. */
    /*
     * V6 : corrige le décalage pleine largeur.
     * On neutralise les contraintes du parent et on force un layout viewport centré.
     */

    body {
      overflow-x: hidden !important;
    }

    main,
    #app,
    body > main,
    body > #app {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    #boggle-shell {
      width: 100vw !important;
      max-width: none !important;
      margin-left: 50% !important;
      margin-right: 0 !important;
      transform: translateX(-50%) !important;
      padding: 0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important;
      box-sizing: border-box !important;
    }

    #boggle-top {
      width: 100% !important;
      max-width: 104rem !important;
      margin-left: auto !important;
      margin-right: auto !important;
      padding-left: clamp(0.2rem, 0.8vw, 0.8rem) !important;
      padding-right: clamp(0.2rem, 0.8vw, 0.8rem) !important;
      box-sizing: border-box !important;
    }

    #boggle-layout {
      width: 100% !important;
      max-width: 104rem !important;
      margin-left: auto !important;
      margin-right: auto !important;
      display: grid !important;
      grid-template-columns:
        minmax(18rem, 1fr)
        minmax(38rem, 1.7fr)
        minmax(18rem, 1fr) !important;
      gap: clamp(0.85rem, 1.2vw, 1.15rem) !important;
      justify-content: stretch !important;
      align-items: start !important;
      box-sizing: border-box !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      min-width: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    #boggle-left > *,
    #boggle-right > *,
    #boggle-center > * {
      max-width: none !important;
    }

    /*
     * Statut placé à droite du titre quand l'écran est large.
     */
    #play-status-panel {
      grid-template-columns: auto minmax(7rem, 1fr) auto auto !important;
      column-gap: 0.95rem !important;
      row-gap: 0.15rem !important;
      align-items: center !important;
    }

    #play-status-panel > h2 {
      grid-column: 1 !important;
      grid-row: 1 !important;
      white-space: nowrap !important;
    }

    #game-status {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      align-self: center !important;
      margin: 0 !important;
      transform: none !important;
      font-size: 1.02rem !important;
      line-height: 1 !important;
      color: #8a6447 !important;
      white-space: nowrap !important;
    }

    #game-status::before {
      content: "•" !important;
      margin-right: 0.38rem !important;
      color: #f47f2f !important;
      font-weight: 900 !important;
    }

    #timer {
      grid-column: 3 !important;
      grid-row: 1 !important;
      justify-self: end !important;
    }

    #end-game {
      grid-column: 4 !important;
      grid-row: 1 !important;
      justify-self: end !important;
    }

    #players-panel {
      height: clamp(14rem, 22vh, 18rem) !important;
    }

    #found-words-panel {
      height: clamp(29rem, 52vh, 39rem) !important;
    }

    #mockup-help-card {
      min-height: clamp(19rem, 31vh, 25rem) !important;
    }

    #mockup-unique-card,
    #mockup-penalty-card {
      min-height: clamp(9rem, 15vh, 12.5rem) !important;
    }

    @media (min-width: 112rem) {
      #boggle-top,
      #boggle-layout {
        max-width: 112rem !important;
      }

      #boggle-layout {
        grid-template-columns:
          minmax(21rem, 1fr)
          minmax(44rem, 1.72fr)
          minmax(21rem, 1fr) !important;
      }

    }

    @media (max-width: 92rem) {
      #boggle-layout {
        grid-template-columns:
          minmax(16rem, 0.95fr)
          minmax(34rem, 1.62fr)
          minmax(16rem, 0.95fr) !important;
      }

      #play-status-panel {
        grid-template-columns: auto minmax(6rem, 1fr) auto !important;
      }

      #end-game {
        grid-column: 1 / -1 !important;
        justify-self: end !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-shell {
        width: 100% !important;
        margin-left: 0 !important;
        transform: none !important;
      }

      #boggle-layout {
        grid-template-columns: 1fr !important;
      }

      #play-status-panel {
        grid-template-columns: auto 1fr !important;
      }

      #game-status {
        grid-column: 2 !important;
      }

      #timer,
      #end-game {
        grid-column: auto !important;
      }
    }

    /* Ancienne couche : injectMockupResponsiveThemeV7. */
    /*
     * V7 : responsive vertical.
     * Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
     */

    :root {
      --top-space: clamp(0.9rem, 1.4vh, 1.35rem);
      --top-height-budget: clamp(5.2rem, 7vh, 6.35rem);
      --layout-available-height: calc(100vh - var(--top-height-budget) - 1.15rem);
      --board-max-side: min(42rem, calc(var(--layout-available-height) - 10.8rem));
    }

    #boggle-shell {
      min-height: 100vh !important;
      padding-top: var(--top-space) !important;
      padding-bottom: clamp(0.6rem, 1vh, 1rem) !important;
    }

    #boggle-top {

      margin-bottom: clamp(0.95rem, 1.6vh, 1.35rem) !important;
      padding-top: 0.15rem !important;
      padding-bottom: 0.15rem !important;
    }

    #boggle-layout {
      min-height: 0 !important;
      height: min(var(--layout-available-height), 52rem) !important;
      align-items: stretch !important;
    }

    #boggle-left,
    #boggle-center,
    #boggle-right {
      height: 100% !important;
      min-height: 0 !important;

    }
    #boggle-left,
    #boggle-right {
      overflow: visible !important;
    }

    #boggle-left {
      display: grid !important;
      grid-template-rows: minmax(10rem, 0.38fr) minmax(17rem, 0.92fr) !important;
      gap: clamp(0.8rem, 1.1vh, 1rem) !important;
    }

    #players-panel,
    #found-words-panel {
      height: auto !important;
      min-height: 0 !important;
    }

    #players-panel {
      display: flex !important;
      flex-direction: column !important;
    }

    #found-words-panel {
      display: flex !important;
      flex-direction: column !important;
    }

    #players,
    #found-words {
      min-height: 0 !important;
      flex: 1 1 auto !important;
    }

    #mockup-right-cards {
      height: 100% !important;
      display: grid !important;
      grid-template-rows: minmax(15rem, 1.35fr) minmax(7.2rem, 0.58fr) minmax(6.8rem, 0.52fr) !important;
      gap: clamp(0.75rem, 1vh, 1rem) !important;
      min-height: 0 !important;
    }

    #mockup-right-cards .mockup-info-card {
      min-height: 0 !important;
      overflow: hidden !important;
    }

    #mockup-help-card {
      min-height: 0 !important;
    }

    #mockup-unique-card,
    #mockup-penalty-card {
      min-height: 0 !important;
    }

    #boggle-center {

      grid-template-rows: auto auto minmax(0, 1fr) auto auto !important;

      height: 100% !important;
      padding: clamp(0.75rem, 1.2vh, 1rem) !important;
      min-height: 0 !important;
    }

    #launch-panel {
      margin-bottom: clamp(0.55rem, 0.9vh, 0.8rem) !important;
      padding-bottom: clamp(0.5rem, 0.8vh, 0.7rem) !important;
    }

    #start {
      height: clamp(3.05rem, 4.4vh, 3.55rem) !important;
      min-height: clamp(3.05rem, 4.4vh, 3.55rem) !important;
    }

    #mode-options-toggle {
      height: clamp(2.65rem, 3.9vh, 3.05rem) !important;
      min-height: clamp(2.65rem, 3.9vh, 3.05rem) !important;
    }

    #play-status-panel {
      margin: 0 0 clamp(0.55rem, 0.9vh, 0.75rem) !important;
      padding-bottom: clamp(0.35rem, 0.65vh, 0.55rem) !important;
      min-height: auto !important;
    }

    #play-status-panel > h2 {
      font-size: clamp(1.35rem, 2.1vw, 1.65rem) !important;
    }

    #game-status {
      font-size: clamp(0.88rem, 1vw, 1.02rem) !important;
    }

    #timer,
    #end-game {
      height: clamp(2.55rem, 4.1vh, 3rem) !important;
      min-height: clamp(2.55rem, 4.1vh, 3rem) !important;
    }

    #end-game {
      min-width: clamp(9.5rem, 11vw, 12rem) !important;
    }

    #board {

      padding: clamp(0.72rem, 1vh, 1rem) !important;
      gap: clamp(0.42rem, 0.8vh, 0.68rem) !important;
    }

    #board .board-cell {
      min-height: clamp(3.9rem, 8.2vh, 6.25rem) !important;
      border-radius: clamp(0.8rem, 1.3vw, 1.1rem) !important;
    }

    #board .board-letter {
      font-size: clamp(1.8rem, 5.4vh, 3.35rem) !important;
    }

    #word-form {

      margin-top: clamp(0.55rem, 0.9vh, 0.8rem) !important;

      grid-template-columns: minmax(0, 1fr) minmax(9.5rem, auto) !important;
    }

    #word-input,
    #word-submit {
      height: clamp(3.05rem, 4.7vh, 3.55rem) !important;
      min-height: clamp(3.05rem, 4.7vh, 3.55rem) !important;
    }

    #word-submit {
      min-width: clamp(9.4rem, 10vw, 11rem) !important;
    }

    #word-feedback {

      margin-top: 0.2rem !important;
      font-size: clamp(0.88rem, 1vw, 1rem) !important;
    }

    .mockup-info-card h2 {
      font-size: clamp(1.08rem, 1.2vw, 1.36rem) !important;
      margin-bottom: clamp(0.55rem, 0.8vh, 0.8rem) !important;
      padding-bottom: clamp(0.45rem, 0.7vh, 0.7rem) !important;
    }

    .mockup-info-card p,
    .mockup-help-list li {
      font-size: clamp(0.83rem, 0.95vw, 1rem) !important;
      line-height: 1.32 !important;
    }

    .mockup-help-list {
      gap: clamp(0.45rem, 0.75vh, 0.72rem) !important;
      margin-top: clamp(0.55rem, 0.85vh, 0.8rem) !important;
    }

    .mockup-info-icon {
      width: clamp(1.9rem, 2.4vw, 2.3rem) !important;
      height: clamp(1.9rem, 2.4vw, 2.3rem) !important;
      font-size: clamp(1rem, 1.25vw, 1.25rem) !important;
    }

    #players-panel > h2,
    #found-words-panel > h2 {

      padding-bottom: clamp(0.4rem, 0.75vh, 0.65rem) !important;
    }

    #players {
      --player-row-height: clamp(2rem, 3.4vh, 2.45rem) !important;
      --player-row-gap: clamp(0.18rem, 0.45vh, 0.32rem) !important;
    }

    .found-words-table {
      font-size: clamp(0.86rem, 0.95vw, 1rem) !important;
    }

    .found-words-word,
    .found-words-points,
    .found-words-player {

      padding-top: 0.24rem !important;
      padding-bottom: 0.24rem !important;
    }
    .found-words-word,
    .found-words-player {
      min-height: clamp(1.85rem, 3vh, 2.35rem) !important;
    }

    /*
     * Hauteurs modestes : on priorise tout visible.
     */
    @media (max-height: 840px) and (min-width: 78rem) {
      :root {
        --top-height-budget: 5.6rem;
        --layout-available-height: calc(100vh - 6.7rem);
        --board-max-side: min(39rem, calc(var(--layout-available-height) - 9.4rem));
      }

      #boggle-shell {
        padding-top: 0.55rem !important;
        padding-bottom: 0.55rem !important;
      }

      #boggle-top {
        margin-bottom: 0.65rem !important;
      }

      #boggle-center {
        padding: 0.7rem !important;
      }

      #launch-panel {
        margin-bottom: 0.45rem !important;
        padding-bottom: 0.45rem !important;
      }

      #start {
        height: 2.95rem !important;
        min-height: 2.95rem !important;
      }

      #mode-options-toggle {
        height: 2.5rem !important;
        min-height: 2.5rem !important;
      }

      #board .board-cell {
        min-height: clamp(3.65rem, 7.4vh, 5.6rem) !important;
      }

    }

    /*
     * Grandes hauteurs : on aère un peu le haut et les panneaux.
     */
    @media (min-height: 920px) and (min-width: 78rem) {
      #boggle-shell {
        padding-top: 1.15rem !important;
      }

      #boggle-top {
        margin-bottom: 1.25rem !important;
      }

      #boggle-layout {
        height: min(calc(100vh - 7.2rem), 55rem) !important;
      }

      #boggle-center {
        padding: 1.1rem !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-layout {
        height: auto !important;
      }

      #boggle-left,
      #boggle-center,
      #boggle-right,
      #mockup-right-cards {
        height: auto !important;
      }

      #boggle-left,
      #mockup-right-cards {
        display: flex !important;
      }

    }
`;

  appendStyleElement(style);
}



function injectTopLaunchEndScreenLayoutV39() {
  const style = createStyleElementOnce("boggle-top-launch-end-screen-v39-style");
  if (!style) {
    return;
  }

  style.textContent = `
    /*
     * V39 : couche finale haut de page / accueil / popup de fin.
     * - positionnement de la barre de connexion ;
     * - état accueil / lancement avant partie ;
     * - popup de fin indépendante de l'ancien #end-screen.
     */

    #boggle-top {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      min-height: clamp(4.7rem, 7vh, 5.6rem) !important;
    }

    #boggle-brand {
      position: relative !important;
      z-index: 3 !important;
      flex: 0 0 auto !important;
    }

    #connection-controls {
      display: block !important;
      position: static !important;
      width: auto !important;
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }

    #connection-core {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: clamp(43rem, 46vw, 50rem) !important;
      display: grid !important;
      grid-template-columns:
        minmax(10.5rem, 14rem)
        minmax(10.5rem, 14rem)
        minmax(8.4rem, auto)
        8.8rem !important;
      gap: clamp(0.55rem, 0.8vw, 0.85rem) !important;
      align-items: end !important;
      z-index: 2 !important;
      pointer-events: auto !important;
    }

    #room-control {
      grid-column: 1 !important;
      justify-self: stretch !important;
      min-width: 0 !important;
    }

    #name-control {
      grid-column: 2 !important;
      justify-self: stretch !important;
      min-width: 0 !important;
    }

    #connect {
      grid-column: 3 !important;
      justify-self: center !important;
      align-self: end !important;
    }

    #status {
      grid-column: 4 !important;
      justify-self: start !important;
      align-self: end !important;
      width: 8.8rem !important;
      min-width: 8.8rem !important;
      box-sizing: border-box !important;
      padding-inline: 0.85rem !important;
    }

    #status[hidden] {
      display: inline-flex !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    #connection-actions {
      display: none !important;
    }

    #player-preferences {
      position: absolute !important;
      right: clamp(0.4rem, 1vw, 1.2rem) !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      z-index: 3 !important;
      margin: 0 !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])),
    #boggle-layout:has(#welcome-panel:not([hidden])) {
      height: auto !important;
      min-height: calc(100vh - 7.2rem) !important;
      align-items: start !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-center,
    #boggle-layout:has(#welcome-panel:not([hidden])) #boggle-center {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.9rem !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-left,
    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-right {
      height: auto !important;
      min-height: 0 !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #boggle-left {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #players-panel {
      height: auto !important;
      min-height: 12rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #found-words-panel {
      height: auto !important;
      min-height: 18rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #launch-panel {
      width: 100% !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: clamp(1rem, 1.4vw, 1.35rem) !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      border-radius: 1.75rem !important;
      background: rgba(255, 248, 232, 0.94) !important;
      box-shadow: 0 0.45rem 1rem rgba(104, 73, 40, 0.075) !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #play-status-panel {
      margin: 0 !important;
      padding: clamp(0.9rem, 1.2vw, 1.15rem) !important;
      border: 2px solid rgba(111, 73, 40, 0.105) !important;
      border-radius: 1.65rem !important;
      background: rgba(255, 248, 232, 0.76) !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #board:empty,
    #boggle-layout:has(#launch-panel:not([hidden])) #word-form,
    #boggle-layout:has(#launch-panel:not([hidden])) #word-feedback {
      display: none !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #mockup-right-cards {
      height: auto !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) .mockup-info-card {
      min-height: auto !important;
      overflow: visible !important;
    }

    #boggle-layout:has(#launch-panel:not([hidden])) #mockup-help-card {
      min-height: 18rem !important;
    }

    body.boggle-end-screen-open {
      overflow: hidden !important;
    }

    body.boggle-end-screen-open #boggle-shell {
      filter: blur(3px) !important;
      pointer-events: none !important;
    }

    body.boggle-end-screen-open #end-screen {
      display: none !important;
    }

    body.boggle-end-screen-open #end-screen-backdrop {
      position: fixed !important;
      inset: 0 !important;
      z-index: 100000 !important;
      background: rgba(47, 34, 24, 0.36) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      filter: none !important;
      cursor: pointer !important;
    }

    #victory-modal-v16 {
      position: fixed !important;
      inset: 0 !important;
      z-index: 100001 !important;

      width: min(40rem, calc(100vw - 2rem)) !important;
      max-width: min(40rem, calc(100vw - 2rem)) !important;
      height: fit-content !important;
      max-height: calc(100vh - 2rem) !important;
      overflow: visible !important;

      margin: auto !important;
      padding: 1.25rem !important;
      box-sizing: border-box !important;

      border: 2px solid rgba(90, 59, 35, 0.24) !important;
      border-radius: 1.35rem !important;
      background: #fff8ea !important;
      color: #4b3322 !important;
      box-shadow: 0 1.4rem 4rem rgba(32, 20, 12, 0.32) !important;

      filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      transform: none !important;
      opacity: 1 !important;
      isolation: isolate !important;
      pointer-events: auto !important;
      font-family: var(--cute-font, system-ui, sans-serif) !important;
    }

    #victory-modal-v16,
    #victory-modal-v16 * {
      filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      text-shadow: none !important;
    }

    #victory-modal-v16 > h2,
    #victory-modal-v16 h2:first-of-type {
      margin: 0 2.4rem 0.75rem 0 !important;
      font-size: clamp(1.55rem, 2.2vw, 2.2rem) !important;
      line-height: 1.05 !important;
      color: #6e3d1d !important;
    }

    #victory-modal-v16 h3 {
      margin: 0.75rem 0 0.45rem !important;
      font-size: clamp(1.08rem, 1.35vw, 1.35rem) !important;
      line-height: 1.1 !important;
      color: #6e3d1d !important;
    }

    #victory-modal-v16 p,
    #victory-modal-v16 li,
    #victory-modal-v16 td,
    #victory-modal-v16 th {
      font-size: clamp(0.88rem, 0.95vw, 1rem) !important;
      line-height: 1.25 !important;
    }

    #victory-modal-v16 table {
      width: 100% !important;
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border-radius: 0.9rem !important;
      overflow: hidden !important;
      background: rgba(255, 250, 239, 0.95) !important;
      border: 1px solid rgba(111, 73, 40, 0.10) !important;
      margin-block: 0.55rem !important;
    }

    #victory-modal-v16 th {
      background: rgba(255, 232, 163, 0.88) !important;
      color: #6e3d1d !important;
      font-weight: 700 !important;
    }

    #victory-modal-v16 th,
    #victory-modal-v16 td {
      padding: 0.42rem 0.58rem !important;
      border-bottom: 1px solid rgba(111, 73, 40, 0.07) !important;
    }

    .victory-modal-close-v16 {
      position: absolute !important;
      top: 0.7rem !important;
      right: 0.7rem !important;
      z-index: 100002 !important;

      width: 2rem !important;
      height: 2rem !important;
      min-height: 2rem !important;
      padding: 0 !important;
      margin: 0 !important;

      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;

      border-radius: 999px !important;
      border: 1px solid rgba(90, 59, 35, 0.28) !important;
      background: #fff8ea !important;
      color: #4b3322 !important;
      font-size: 1.25rem !important;
      font-weight: 950 !important;
      line-height: 1 !important;
      box-shadow: 0 0.35rem 0.9rem rgba(32, 20, 12, 0.12) !important;
      cursor: pointer !important;
    }

    @media (min-width: 100rem) {
      #connection-core {
        width: clamp(46rem, 44vw, 52rem) !important;
        grid-template-columns:
          minmax(11rem, 14.5rem)
          minmax(11rem, 14.5rem)
          minmax(8.8rem, auto)
          8.9rem !important;
      }

      #status {
        width: 8.9rem !important;
        min-width: 8.9rem !important;
      }
    }

    @media (max-width: 78rem) {
      #boggle-top {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 0.75rem !important;
      }

      #connection-controls {
        display: flex !important;
        flex-wrap: wrap !important;
      }

      #connection-core {
        position: static !important;
        transform: none !important;
        width: 100% !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
      }

      #status[hidden] {
        display: none !important;
      }

      #player-preferences {
        position: static !important;
        transform: none !important;
      }

      #victory-modal-v16 {
        width: calc(100vw - 1rem) !important;
        max-width: calc(100vw - 1rem) !important;
      }
    }
`;

  appendStyleElement(style);
}


function injectRulesHelpOptionsPanelV38() {
  const style = createStyleElementOnce("boggle-rules-help-options-v38-style");
  if (!style) {
    return;
  }

  style.textContent = `
    /*
     * V38 : couche finale du panneau règles / aide / options.
     * Les styles de boutons sont centralisés dans V34.
     * Les règles plateau/saisie finales sont centralisées dans V36.
     */

    #mockup-help-card.rules-card {
      overflow: visible !important;
      pointer-events: auto !important;
    }

    #mockup-help-card.rules-card .mockup-help-list,
    #mockup-help-card.rules-card > p {
      display: none !important;
    }

    .rules-help-panel-v22 {
      display: grid !important;
      gap: 0.65rem !important;
      margin: 0.15rem 0 0 !important;
      padding: 0 !important;
      border: 0 !important;
      position: relative !important;
      z-index: 20 !important;
      pointer-events: auto !important;
    }

    .rules-help-actions-v22 {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 0.65rem !important;
    }

    .rules-help-level-v22 {
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      min-height: 2rem !important;
      padding: 0 0.75rem !important;
      border-radius: 999px !important;
      background: rgba(90, 59, 35, 0.08) !important;
      color: #5d351e !important;
      font-weight: 900 !important;
      font-size: clamp(0.9rem, 0.98vw, 1.04rem) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .rules-help-content-v22 {
      display: grid !important;
      gap: 0.5rem !important;
      padding: 0.72rem 0 0 !important;
      border-top: 1px solid rgba(111, 73, 40, 0.13) !important;
    }

    .rules-help-content-title-v22 {
      margin: 0 !important;
      color: #6e3d1d !important;
      font-weight: 950 !important;
      font-size: clamp(1rem, 1.08vw, 1.16rem) !important;
      line-height: 1.1 !important;
    }

    .rules-help-details-v22 {
      display: grid !important;
      gap: 0.4rem !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }

    .rules-help-details-v22 li {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      gap: 0.46rem !important;
      align-items: start !important;
      font-size: clamp(0.92rem, 1vw, 1.08rem) !important;
      line-height: 1.3 !important;
    }

    .rules-help-bullet-v22 {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 1.55rem !important;
      height: 1.55rem !important;
      border-radius: 999px !important;
      background: rgba(255, 232, 163, 0.78) !important;
      color: #6e3d1d !important;
      font-weight: 950 !important;
      font-size: 0.75rem !important;
    }

    .rules-solution-list-v22 {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.35rem !important;
      max-height: clamp(9rem, 20vh, 14rem) !important;
      overflow-y: auto !important;
      padding: 0.3rem 0.15rem 0.1rem !important;
    }

    .rules-solution-chip-v22 {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 1.65rem !important;
      padding: 0 0.55rem !important;
      border-radius: 999px !important;
      background: rgba(255, 250, 239, 0.95) !important;
      border: 1px solid rgba(111, 73, 40, 0.12) !important;
      color: #5d351e !important;
      font-weight: 800 !important;
      font-size: 0.88rem !important;
    }

    .mockup-option-status-v18,
    .mockup-option-status-v20 {
      display: none !important;
    }

    #mockup-unique-card[hidden],
    #mockup-penalty-card[hidden] {
      display: none !important;
    }

    #mockup-penalty-card strong {
      font-weight: 950 !important;
      color: #6e3d1d !important;
    }

    #mockup-right-cards .mockup-info-card h2,
    #players-panel > h2,
    #found-words-panel > h2 {
      font-size: clamp(1.45rem, 1.42vw, 1.68rem) !important;
      line-height: 1.08 !important;
      letter-spacing: -0.035em !important;
    }

    #mockup-right-cards .mockup-info-card p,
    #mockup-right-cards .mockup-info-card li {
      font-size: clamp(1rem, 1.05vw, 1.14rem) !important;
      line-height: 1.34 !important;
    }

    #players-panel > h2,
    #found-words-panel > h2 {
      margin-bottom: 0.9rem !important;
    }

    #word-form {
      width: min(100%, 49rem) !important;
      margin: clamp(1.15rem, 1.8vh, 1.65rem) auto 0 !important;
      min-height: auto !important;
      padding: 0.72rem 0.82rem !important;
      border: 0 !important;
      border-top: 0 !important;
      border-radius: 9999px !important;
      background: rgba(255, 248, 232, 0.96) !important;
      box-shadow: 0 0.35rem 1rem rgba(97, 65, 35, 0.08) !important;
      overflow: visible !important;
    }

    #word-form.boggle-feedback-host,
    #word-form.boggle-feedback-accepted,
    #word-form.boggle-feedback-invalid,
    #word-form.boggle-feedback-duplicate {
      outline: none !important;
      border-radius: 9999px !important;
    }

    #word-input,
    #word-submit {
      border-radius: 9999px !important;
    }

    #word-feedback {
      width: min(100%, 49rem) !important;
      margin: 0.35rem auto 0 !important;
      min-height: 1.55rem !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      text-align: center !important;
    }

    #word-feedback:empty {
      visibility: hidden !important;
    }

    #word-feedback:not(:empty) {
      visibility: visible !important;
      color: #5d351e !important;
      font-weight: 850 !important;
    }
`;

  appendStyleElement(style);
}


function injectFoundWordsPanelV37() {
  const style = createStyleElementOnce("boggle-found-words-panel-v37-style");
  if (!style) {
    return;
  }

  style.textContent = `
    /*
     * V40 : couche finale du panneau "Mots trouvés", onglets joueurs et survol.
     * Les règles plateau/saisie finales sont centralisées dans V36.
     */

    .found-words-viewer {
      display: grid !important;
      gap: 0.65rem !important;
      min-height: 0 !important;
    }

    #found-words .found-words-player-tabs {
      display: flex !important;
      gap: 0.4rem !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      padding: 0.25rem !important;
      border-radius: 999px !important;
      background: rgba(90, 59, 35, 0.06) !important;
    }

    #found-words .found-words-player-tab,
    #found-words button.found-words-player-tab {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 2rem !important;
      padding: 0.35rem 0.75rem !important;
      border-radius: 999px !important;
      background: #fff1d0 !important;
      color: #5d351e !important;
      border: 2px solid rgba(122, 75, 29, 0.22) !important;
      box-shadow: none !important;
      text-shadow: none !important;
      opacity: 1 !important;
      visibility: visible !important;
      font-weight: 900 !important;
      cursor: pointer !important;
    }

    #found-words .found-words-player-tab[aria-selected="true"],
    #found-words button.found-words-player-tab[aria-selected="true"] {
      background: #ea7e33 !important;
      color: #fff8f1 !important;
      border-color: rgba(126, 59, 18, 0.32) !important;
    }

    #found-words .found-words-player-tab:not([aria-selected="true"]):hover,
    #found-words button.found-words-player-tab:not([aria-selected="true"]):hover,
    #found-words .found-words-player-tab:not([aria-selected="true"]):focus-visible,
    #found-words button.found-words-player-tab:not([aria-selected="true"]):focus-visible {
      background: #ffe5ad !important;
      color: #4b3322 !important;
      transform: translateY(-1px) !important;
      outline: 3px solid rgba(244, 196, 48, 0.28) !important;
      outline-offset: 2px !important;
      filter: none !important;
    }

    .found-words-summary {
      display: flex !important;
      justify-content: space-between !important;
      gap: 0.6rem !important;
      align-items: center !important;
      padding: 0.4rem 0.65rem !important;
      border-radius: 999px !important;
      background: rgba(255, 246, 224, 0.74) !important;
      color: #5d351e !important;
      font-weight: 950 !important;
    }

    .found-words-table {
      grid-template-columns: minmax(0, 1fr) auto !important;
      gap: 0.24rem 0.48rem !important;
      align-items: center !important;
    }

    .found-words-header-cell {
      color: rgba(93, 53, 30, 0.76) !important;
      font-weight: 950 !important;
    }

    .found-words-row {
      display: contents !important;
    }

    .found-words-word {
      display: inline-flex !important;
      align-items: center !important;
      min-width: 0 !important;
      gap: 0.4rem !important;
      padding: 0.28rem 0.35rem !important;
      border-radius: 0.7rem !important;
    }

    .found-words-word strong {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .found-words-points {
      justify-self: end !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 2rem !important;
      min-height: 1.65rem !important;
      padding: 0.12rem 0.48rem !important;
      border-radius: 999px !important;
      font-weight: 950 !important;
      font-variant-numeric: tabular-nums !important;
    }

    .found-word-dot {
      width: 0.65rem !important;
      height: 0.65rem !important;
      min-width: 0.65rem !important;
      border-radius: 999px !important;
      background: currentColor !important;
      opacity: 0.95 !important;
    }

    .found-word-score-1 {
      color: #6a3e1f !important;
      background: rgba(90, 59, 35, 0.05) !important;
    }

    .found-word-score-2 {
      color: #137a48 !important;
      background: rgba(24, 147, 86, 0.09) !important;
    }

    .found-word-score-3 {
      color: #1468c7 !important;
      background: rgba(20, 104, 199, 0.10) !important;
    }

    .found-word-score-5 {
      color: #7d3fc7 !important;
      background: rgba(125, 63, 199, 0.11) !important;
    }

    .found-word-score-11 {
      color: #d42323 !important;
      background: rgba(212, 35, 35, 0.11) !important;
    }

    .found-word-score-1 .found-words-points { background: rgba(90, 59, 35, 0.10) !important; }
    .found-word-score-2 .found-words-points { background: rgba(24, 147, 86, 0.16) !important; }
    .found-word-score-3 .found-words-points { background: rgba(20, 104, 199, 0.17) !important; }
    .found-word-score-5 .found-words-points { background: rgba(125, 63, 199, 0.18) !important; }
    .found-word-score-11 .found-words-points { background: rgba(212, 35, 35, 0.18) !important; }

    .found-words-empty-row {
      grid-column: 1 / -1 !important;
    }

    /* V40 : anciennes finitions V30 rapatriées ici. */
    #found-words {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    .found-words-viewer {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    .found-words-summary {
      background: rgba(255, 248, 231, 0.72) !important;
      border: 1px solid rgba(122, 75, 29, 0.14) !important;
      box-shadow: none !important;
    }

    .found-words-table {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 0.15rem 0 !important;
    }

    .found-words-header-cell {
      background: transparent !important;
      border: 0 !important;
      color: rgba(93, 53, 30, 0.68) !important;
      padding: 0.18rem 0.32rem !important;
    }

    .found-words-row {
      border-radius: 0.65rem !important;
    }

    .found-words-word {
      background: transparent !important;
      color: #25150d !important;
    }

    .found-words-word strong {
      color: #25150d !important;
    }

    .found-word-dot {
      box-shadow: 0 0 0 2px rgba(255,255,255,0.72) !important;
    }

    .found-word-score-1 .found-word-dot { color: #21a663 !important; }
    .found-word-score-2 .found-word-dot { color: #16824f !important; }
    .found-word-score-3 .found-word-dot { color: #1468c7 !important; }
    .found-word-score-5 .found-word-dot { color: #7d3fc7 !important; }
    .found-word-score-11 .found-word-dot { color: #d42323 !important; }

    .found-word-score-1,
    .found-word-score-2,
    .found-word-score-3,
    .found-word-score-5,
    .found-word-score-11 {
      color: #25150d !important;
      background: transparent !important;
    }

    .found-word-score-1 .found-words-points { background: rgba(33, 166, 99, 0.14) !important; color: #14653c !important; }
    .found-word-score-2 .found-words-points { background: rgba(22, 130, 79, 0.15) !important; color: #105a38 !important; }
    .found-word-score-3 .found-words-points { background: rgba(20, 104, 199, 0.15) !important; color: #0f4d95 !important; }
    .found-word-score-5 .found-words-points { background: rgba(125, 63, 199, 0.16) !important; color: #622aa6 !important; }
    .found-word-score-11 .found-words-points { background: rgba(212, 35, 35, 0.16) !important; color: #a31818 !important; }

    .found-words-empty-row {
      background: transparent !important;
      border: 0 !important;
      color: rgba(37, 21, 13, 0.72) !important;
      padding: 0.45rem 0.32rem !important;
    }

    .found-words-row.has-hover-path .found-words-word {
      cursor: pointer !important;
    }
`;

  appendStyleElement(style);
}


function injectFinalBoardInputV36() {
  const style = createStyleElementOnce("boggle-final-board-input-v36-style");
  if (!style) {
    return;
  }

  style.textContent = `
    /*
     * V36 : couche finale plateau + champ "Votre mot".
     * Le plateau reçoit une taille calculée par JS dans --board-fit-size-v31.
     * Le formulaire reste dans le flux, sous la grille, sans superposition.
     */
    #boggle-center {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      justify-content: flex-start !important;
      overflow: visible !important;
      gap: 0.72rem !important;
      contain: none !important;
    }

    #play-status-panel {
      flex: 0 0 auto !important;
      margin-bottom: 0 !important;
    }

    #board {
      flex: 0 0 auto !important;
      align-self: center !important;
      width: var(--board-fit-size-v31, min(100%, 36rem)) !important;
      height: var(--board-fit-size-v31, min(100vw, 36rem)) !important;
      max-width: 100% !important;
      max-height: var(--board-fit-size-v31, 36rem) !important;
      aspect-ratio: 1 / 1 !important;
      margin: 0 auto !important;
      transform: none !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    #word-form {
      flex: 0 0 auto !important;
      align-self: center !important;
      width: min(100%, 43rem) !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      transform: none !important;
      position: relative !important;
      z-index: 2 !important;
    }

    #word-feedback {
      flex: 0 0 auto !important;
      align-self: center !important;
      width: min(100%, 43rem) !important;
      margin: 0 auto !important;
    }
`;

  appendStyleElement(style);
}


function injectFinalButtonsV34() {
  const style = createStyleElementOnce("boggle-final-buttons-v34-style");
  if (!style) {
    return;
  }

  style.textContent = `
    /*
     * V34 : couche finale dédiée aux boutons et contrôles cliquables.
     * - bouton d'aide = bouton standard, sans effet 3D ;
     * - boutons grille personnalisée visibles et cohérents ;
     * - tremblement discret sur saisie impossible, sans bloquer l'envoi.
     */

    #mockup-help-card .rules-help-button-v22,
    #mockup-help-card button.rules-help-button-v22 {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-width: 5.2rem !important;
      min-height: 2.45rem !important;
      padding: 0.45rem 0.9rem !important;
      border-radius: 0.8rem !important;
      background: #fff6df !important;
      background-image: none !important;
      color: #4b3322 !important;
      border: 2px solid rgba(122, 75, 29, 0.34) !important;
      box-shadow: 0 0.2rem 0.55rem rgba(97, 65, 35, 0.10) !important;
      font-weight: 900 !important;
      text-shadow: none !important;
      cursor: pointer !important;
      pointer-events: auto !important;
      transform: none !important;
      filter: none !important;
    }

    #mockup-help-card .rules-help-button-v22::after,
    #mockup-help-card button.rules-help-button-v22::after {
      content: none !important;
      display: none !important;
    }

    #mockup-help-card .rules-help-button-v22:hover,
    #mockup-help-card .rules-help-button-v22:focus-visible {
      background: #ffedc2 !important;
      transform: translateY(-1px) !important;
      filter: none !important;
      outline: 3px solid rgba(244, 196, 48, 0.28) !important;
      outline-offset: 2px !important;
      box-shadow: 0 0.25rem 0.6rem rgba(97, 65, 35, 0.13) !important;
    }

    #mode-controls #start-solution-mode,
    #mode-controls #fill-example-board {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 2.65rem !important;
      padding: 0.55rem 1rem !important;
      border-radius: 999px !important;
      background-image: none !important;
      color: #4b3322 !important;
      border: 2px solid rgba(122, 75, 29, 0.34) !important;
      box-shadow: 0 0.28rem 0.75rem rgba(97, 65, 35, 0.13) !important;
      font-weight: 950 !important;
      text-shadow: none !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    #mode-controls #start-solution-mode {
      background: #ea7e33 !important;
      color: #fff8f1 !important;
      border-color: rgba(126, 59, 18, 0.34) !important;
    }

    #mode-controls #fill-example-board {
      background: #fff6df !important;
      color: #4b3322 !important;
    }

    #mode-controls #start-solution-mode:hover,
    #mode-controls #fill-example-board:hover,
    #mode-controls #start-solution-mode:focus-visible,
    #mode-controls #fill-example-board:focus-visible {
      transform: translateY(-1px) !important;
      filter: none !important;
      outline: 3px solid rgba(244, 196, 48, 0.34) !important;
      outline-offset: 2px !important;
    }

    #word-input.boggle-keyboard-word-impossible {
      border-color: rgba(239, 81, 69, 0.52) !important;
      box-shadow:
        inset 0 0 0 2px rgba(255, 222, 216, 0.75),
        0 0 0 3px rgba(239, 81, 69, 0.12) !important;
      animation: boggle-keyboard-word-shake-v28 240ms ease-out;
    }

    @keyframes boggle-keyboard-word-shake-v28 {
      0%, 100% {
        transform: translateX(0);
      }

      25% {
        transform: translateX(-3px);
      }

      50% {
        transform: translateX(3px);
      }

      75% {
        transform: translateX(-1px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #word-input.boggle-keyboard-word-impossible {
        animation: none !important;
      }
    }
`;

  appendStyleElement(style);
}
