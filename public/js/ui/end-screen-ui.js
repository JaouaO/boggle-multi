export function renderEndScreen(anchorElement, options, panelElement = null) {
  const {
    players = [], currentPlayerId, maxScore, totalWords, durationSeconds,
    invalidCount = 0, helpLevel = 0, dailyLeaderboard = null,
    restartMessage = "", wordCountsByLength = null,
    foundWords = [], invalidWords = null,
    gameContext = "solo", gameKey = "", dailyDate = "",
    dailyHistoryOnly = false, dailyPage = null,
  } = options;

  const panel = panelElement ? getEndScreenParts(panelElement) : ensureEndScreen(anchorElement);
  const sortedPlayers = [...players].sort(sortPlayers);
  const currentPlayer = sortedPlayers.find((player) => player.id === currentPlayerId);
  const solo = gameContext === "solo";
  const daily = gameContext === "daily";
  // The daily ranking shares the multi-player podium; other results keep their own mascot.
  panel.element.dataset.endArtB1c = daily || (!solo && sortedPlayers.length > 1) ? "multi" : "single";

  panel.element.hidden = false;
  panel.title.textContent = dailyHistoryOnly ? "Grille du jour" : "Fin de partie";
  if (dailyHistoryOnly) {
    const entry = dailyLeaderboard?.status === "loaded" ? dailyLeaderboard.data?.playerEntry : null;
    const score = Number(entry?.score);
    const words = Number(entry?.wordCount);
    panel.message.textContent = entry && Number.isFinite(score) && Number.isFinite(words)
      ? `Votre résultat retrouvé : ${score} point${score !== 1 ? "s" : ""} et ${words} mot${words !== 1 ? "s" : ""}. Les statistiques détaillées ne sont plus disponibles.`
      : dailyLeaderboard?.status === "loaded"
        ? "Votre tentative a déjà été lancée, mais votre score n'a pas pu être retrouvé. Voici le classement du jour."
        : dailyLeaderboard?.status === "error"
          ? "Votre tentative a déjà été lancée. Impossible de retrouver votre résultat ou le classement pour le moment."
          : "Votre tentative a déjà été lancée. Recherche de votre résultat et du classement…";
  } else if (currentPlayer) {
    const score = Number(currentPlayer.score ?? 0);
    const count = Number(currentPlayer.wordCount ?? 0);
    const scoreText = document.createElement("strong");
    scoreText.className = "boggle-end-score-h9f2";
    scoreText.textContent = String(score);
    const wordsText = document.createElement("strong");
    wordsText.className = "boggle-end-words-h9f2";
    wordsText.textContent = String(count);
    const intro = document.createElement("span");
    intro.className = "boggle-end-intro-h9f2";
    intro.textContent = "Vous terminez avec";
    const scoreline = document.createElement("span");
    scoreline.className = "boggle-end-scoreline-h9f2";
    scoreline.append(scoreText, ` point${score !== 1 ? "s" : ""} et `,
      wordsText, ` mot${count !== 1 ? "s" : ""}.`);
    panel.message.replaceChildren(intro, scoreline);
  } else {
    panel.message.textContent = "La partie est terminée.";
  }

  const possibleWords = Number(totalWords ?? 0);
  panel.stats.textContent =
    `Grille : ${possibleWords} mot${possibleWords > 1 ? "s" : ""} possible${possibleWords > 1 ? "s" : ""} · ` +
    `${Number(maxScore ?? 0)} points maximum · durée ${formatDuration(durationSeconds)}.`;

  updateEndScreenExtraStatsH6A(panel, currentPlayer, invalidCount, helpLevel);
  if (!dailyHistoryOnly) updateDetailedRoundStatsH9E(panel, {
    currentPlayer, totalWords, durationSeconds,
    wordCountsByLength, foundWords, invalidWords,
  });
  updateDailyLeaderboardH9B(panel, daily ? dailyLeaderboard : null, currentPlayerId, dailyDate, dailyHistoryOnly,
    daily && !panelElement ? dailyPage : null);

  panel.nextRound.textContent = restartMessage;
  panel.nextRound.hidden = !restartMessage;

  const rankingTitle = panel.element.querySelector(".boggle-end-ranking-title");
  rankingTitle.textContent = "Classement de la partie";
  rankingTitle.hidden = daily;
  panel.ranking.hidden = daily;
  const nativeColumns = panel.element.querySelector(".boggle-end-view-ranking-h9f2 > .boggle-end-ranking-columns-h9f2");
  if (nativeColumns) nativeColumns.hidden = daily;
  panel.ranking.replaceChildren();

  if (!daily) {
    // Modale et résultat permanent : cinq premiers, puis votre ligne si hors top 5.
    const displayed = sortedPlayers.slice(0, 5).map((player, index) => ({ player, index }));
    const personalIndex = sortedPlayers.findIndex((player) => player.id === currentPlayerId);
    if (personalIndex >= 5) displayed.push({ player: sortedPlayers[personalIndex], index: personalIndex });
    displayed.forEach(({ player, index }) => {
      const item = document.createElement("li");
      const current = player.id === currentPlayerId;
      if (index >= 5) item.classList.add("boggle-end-outside-top-h9f2");
      item.className = "boggle-end-ranking-item";
      item.classList.toggle("boggle-end-ranking-item-current", current);
      const rank = document.createElement("span");
      rank.className = "boggle-end-rank-number-h9f2";
      rank.textContent = String(index + 1);
      const name = document.createElement("strong");
      name.className = "boggle-end-rank-name-h9f2";
      name.textContent = player.name || "Joueur";
      if (current) {
        const you = document.createElement("span");
        you.className = "boggle-end-you-h9f2";
        you.textContent = "Vous";
        name.append(" ", you);
      }
      const score = document.createElement("strong");
      score.className = "boggle-end-rank-score-h9f2";
      score.textContent = String(Number(player.score ?? 0));
      const count = document.createElement("span");
      count.className = "boggle-end-rank-words-h9f2";
      count.textContent = String(Number(player.wordCount ?? 0));
      item.append(rank, name, score, count);
      panel.ranking.append(item);
    });
  }

  ensureEndScreenViewsH9F2(panel, { solo, daily, gameKey });
  const overview = panel.element.querySelector(".boggle-end-overview-h9f2");
  if (overview) overview.hidden = dailyHistoryOnly;
  const actions = panel.element.querySelector(".boggle-end-actions-h9f2");
  if (actions) actions.hidden = dailyHistoryOnly;
  const statsView = panel.element.querySelector(".boggle-end-view-stats-h9f2");
  if (statsView && dailyHistoryOnly) statsView.hidden = true;
}

export function hideEndScreen() {
  const panel = document.querySelector("#end-screen");

  if (panel) {
    panel.hidden = true;
    panel.classList.remove("boggle-end-inline-m1b");
  }
  document.body.classList.remove("boggle-results-inline-m1b");
}

function ensureEndScreen(anchorElement) {
  let panel = document.querySelector("#end-screen");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "end-screen";
    panel.hidden = true;
    panel.classList.add("boggle-end-screen-panel");

    const title = document.createElement("h2");
    title.id = "end-screen-title";
    title.classList.add("boggle-end-screen-title");

    const message = document.createElement("p");
    message.id = "end-screen-message";
    message.classList.add("boggle-end-screen-message");

    const stats = document.createElement("p");
    stats.id = "end-screen-stats";

    const nextRound = document.createElement("p");
    nextRound.id = "end-screen-next-round";
    nextRound.classList.add("boggle-end-screen-next-round");
    nextRound.hidden = true;

    const rankingTitle = document.createElement("h3");
    rankingTitle.className = "boggle-end-ranking-title";
    rankingTitle.textContent = "Classement";

    const ranking = document.createElement("ol");
    ranking.id = "end-screen-ranking";

    panel.append(title, message, stats, nextRound, rankingTitle, ranking);
    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return getEndScreenParts(panel);
}

function getEndScreenParts(panel) {
  const prefix = panel.id === "victory-modal-v16" ? "victory-" : "";
  const part = (id) => panel.querySelector(`#${prefix}${id}`);

  return {
    element: panel,
    title: part("end-screen-title"),
    message: part("end-screen-message"),
    stats: part("end-screen-stats"),
    nextRound: part("end-screen-next-round"),
    ranking: part("end-screen-ranking"),
  };
}

function sortPlayers(a, b) {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  if (a.wordCount !== b.wordCount) {
    return b.wordCount - a.wordCount;
  }

  return a.name.localeCompare(b.name, "fr");
}

function updateEndScreenExtraStatsH6A(panel, currentPlayer, fallbackInvalidCount, helpLevel) {
  let extraStats = panel.element.querySelector(".end-screen-extra-stats-h6a");

  if (!extraStats) {
    extraStats = document.createElement("p");
    extraStats.className = "end-screen-extra-stats-h6a";
    panel.stats.insertAdjacentElement("afterend", extraStats);
  }

  if (!currentPlayer) {
    extraStats.hidden = true;
    extraStats.textContent = "";
    return;
  }

  const invalidCount = getPlayerInvalidCountH6A(currentPlayer, fallbackInvalidCount);
  const invalidLabel = String(invalidCount);

  extraStats.hidden = false;
  extraStats.textContent =
    `Erreurs : ${invalidLabel} · Aide : ${formatHelpLevelH6A(helpLevel)}.`;
}

function getPlayerInvalidCountH6A(player, fallbackInvalidCount) {
  const candidates = [
    player?.invalidCount,
    player?.invalidWordsCount,
    player?.invalidWordCount,
    fallbackInvalidCount,
  ];

  for (const value of candidates) {
    const count = Number(value);

    if (Number.isFinite(count) && count >= 0) {
      return Math.floor(count);
    }
  }

  return 0;
}

function formatHelpLevelH6A(helpLevel) {
  const normalizedLevel = Math.max(
    0,
    Math.min(2, Math.round(Number(helpLevel ?? 0)))
  );

  return `niveau ${normalizedLevel}`;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}min ${remainingSeconds}s`;
}

function updateDailyLeaderboardH9B(panel, leaderboardState, currentPlayerId, dateKey, dailyHistoryOnly = false, dailyPage = null) {
  const section = ensureDailyLeaderboardSectionH9B(panel);
  if (!leaderboardState) {
    section.hidden = true;
    section.replaceChildren();
    return;
  }
  section.hidden = false;
  const title = document.createElement("h3");
  title.textContent = "Classement du jour";
  const heading = document.createElement("div");
  heading.className = "boggle-end-daily-heading-h9f2";
  heading.append(title);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    const date = new Date(`${dateKey}T12:00:00`);
    if (Number.isFinite(date.getTime())) {
      const text = document.createElement("span");
      text.className = "boggle-end-daily-date-h9f2";
      text.textContent = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      }).format(date);
      heading.append(text);
    }
  }
  if (leaderboardState.status !== "loaded") {
    const message = document.createElement("p");
    message.textContent = leaderboardState.status === "error"
      ? "Classement indisponible pour le moment."
      : "Classement en cours de chargement…";
    message.setAttribute("role", "status");
    section.replaceChildren(heading, message);
    if (leaderboardState.status === "error") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "boggle-end-switch-h9f2";
      retry.setAttribute(dailyHistoryOnly ? "data-daily-history-retry-m1b" : "data-daily-leaderboard-retry-s4", "");
      retry.textContent = "Réessayer";
      section.append(retry);
    }
    return;
  }
  const data = leaderboardState.data;
  const paged = dailyPage !== null && Array.isArray(data?.pageEntries);
  const pageData = paged && dailyPage?.data ? dailyPage.data : data;
  const entries = paged ? (Array.isArray(pageData?.pageEntries) ? pageData.pageEntries : [])
    : (Array.isArray(data?.entries) ? data.entries.slice(0, 5) : []);
  const playerRank = Number(data?.playerRank ?? data?.playerEntry?.rank ?? 0);
  const total = Number(data?.totalEntries ?? entries.length);
  const summary = document.createElement("p");
  summary.className = "daily-leaderboard-summary-h9b";
  summary.textContent = playerRank
    ? `Votre place : ${playerRank} sur ${total} joueur${total > 1 ? "s" : ""}.`
    : "Votre score n’a pas été retrouvé dans le classement du jour.";

  const list = document.createElement("ol");
  list.className = "daily-leaderboard-list-h9b";
  function addEntry(entry, outsideTop = false) {
    const current = playerRank > 0 && Number(entry.rank) === playerRank;
    const row = document.createElement("li");
    row.className = "boggle-end-ranking-item daily-leaderboard-entry-h9b";
    row.classList.toggle("boggle-end-ranking-item-current", current);
    if (outsideTop) row.classList.add("boggle-end-outside-top-h9f2");
    const rank = document.createElement("span");
    rank.className = "boggle-end-rank-number-h9f2";
    rank.textContent = String(entry.rank || "—");
    const name = document.createElement("strong");
    name.className = "boggle-end-rank-name-h9f2";
    name.textContent = entry.playerName || "Joueur";
    if (current) {
      const you = document.createElement("span");
      you.className = "boggle-end-you-h9f2";
      you.textContent = "Vous";
      name.append(" ", you);
    }
    const score = document.createElement("strong");
    score.className = "boggle-end-rank-score-h9f2";
    score.textContent = String(Number(entry.score ?? 0));
    const words = document.createElement("span");
    words.className = "boggle-end-rank-words-h9f2";
    words.textContent = String(Number(entry.wordCount ?? 0));
    row.append(rank, name, score, words);
    list.append(row);
  }
  entries.forEach((entry) => addEntry(entry));
  if (!paged && data?.playerEntry && !entries.some((entry) => Number(entry.rank) === playerRank)) {
    addEntry(data.playerEntry, true);
  }
  if (!list.children.length && !paged) {
    const empty = document.createElement("p");
    empty.textContent = "Aucun score enregistré pour le moment.";
    section.replaceChildren(heading, empty);
    return;
  }
  if (paged) {
    const page = Math.max(1, Number(pageData.page) || 1);
    const pageSize = Math.max(1, Number(pageData.pageSize) || 25);
    const totalPages = Math.max(1, Number(pageData.totalPages) || 1);
    const pager = document.createElement("nav");
    pager.className = "boggle-daily-pager-m1c2";
    pager.setAttribute("aria-label", "Pages du classement quotidien");
    const pageInfo = document.createElement("span");
    pageInfo.className = "boggle-daily-page-label-m1c2";
    pageInfo.tabIndex = -1;
    pageInfo.textContent = `Page ${page} sur ${totalPages}`;
    const makeButton = (action, text, disabled) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "boggle-end-switch-h9f2";
      button.dataset.dailyPageM1c2 = action;
      button.textContent = text;
      button.disabled = disabled || dailyPage?.status === "loading";
      return button;
    };
    pager.append(
      makeButton("previous", "← Précédent", page <= 1),
      pageInfo,
      makeButton("next", "Suivant →", page >= totalPages)
    );
    const content = [heading, summary];
    if (Number.isInteger(playerRank) && playerRank > 0 &&
        Math.ceil(playerRank / pageSize) !== page) {
      const personalButton = makeButton("mine", `Voir ma place (n° ${playerRank})`, false);
      personalButton.classList.add("boggle-daily-my-rank-m1c2");
      content.push(personalButton);
    }
    if (dailyPage?.status === "loading" || dailyPage?.status === "error") {
      const status = document.createElement("p");
      status.className = "boggle-daily-page-status-m1c2";
      status.setAttribute("role", "status");
      status.textContent = dailyPage.status === "error"
        ? "Impossible de charger cette page. Le classement précédent reste affiché."
        : "Chargement de la page…";
      content.push(status);
      if (dailyPage.status === "error") content.push(makeButton("retry", "Réessayer", false));
    }
    if (!list.children.length) {
      const empty = document.createElement("p");
      empty.textContent = "Aucun score enregistré pour le moment.";
      content.push(empty);
    } else {
      list.classList.add("boggle-daily-scroll-m1c2");
      list.classList.toggle("boggle-daily-page-after-first-m1c2", page > 1);
      content.push(createEndRankingColumnsH9F2(), list);
    }
    content.push(pager);
    section.replaceChildren(...content);
  } else {
    section.replaceChildren(heading, summary, createEndRankingColumnsH9F2(), list);
  }
}

function ensureDailyLeaderboardSectionH9B(panel) {
  let section = panel.element.querySelector(".daily-leaderboard-h9b");

  if (!section) {
    section = document.createElement("section");
    section.className = "daily-leaderboard-h9b";
    const anchor = panel.nextRound instanceof HTMLElement ? panel.nextRound : panel.element;

    anchor.insertAdjacentElement("beforebegin", section);
  }

  return section;
}

function createEndRankingColumnsH9F2() {
  const header = document.createElement("div");
  header.className = "boggle-end-ranking-columns-h9f2";
  for (const label of ["#", "Joueur", "Points", "Mots"]) {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  }
  return header;
}

/* H9f2 — deux vues dans le même dialogue ; aucune illustration provisoire. */
function ensureInlineEndHeroB1c7(element) {
  let copy = element.querySelector(":scope > .boggle-end-hero-b1c2 > .boggle-end-hero-copy-b1c2");
  if (copy) return copy;
  const hero = document.createElement("div");
  hero.className = "boggle-end-hero-b1c2";
  copy = document.createElement("div");
  copy.className = "boggle-end-hero-copy-b1c2";
  hero.append(copy);
  element.prepend(hero);
  return copy;
}

function ensureEndScreenViewsH9F2(panel, { solo, daily, gameKey }) {
  const element = panel.element;
  let overview = element.querySelector(".boggle-end-overview-h9f2");
  if (!overview) {
    overview = document.createElement("section");
    overview.className = "boggle-end-overview-h9f2";
    overview.setAttribute("aria-label", "Informations sur la grille");
  }
  const extra = element.querySelector(".end-screen-extra-stats-h6a");
  overview.append(panel.stats);
  if (extra) overview.append(extra);

  let rankingView = element.querySelector(".boggle-end-view-ranking-h9f2");
  if (!rankingView) {
    rankingView = document.createElement("section");
    rankingView.className = "boggle-end-view-ranking-h9f2";
    rankingView.setAttribute("aria-label", "Classement");
  }
  const nativeTitle = element.querySelector(".boggle-end-ranking-title");
  const dailySection = element.querySelector(".daily-leaderboard-h9b");
  if (nativeTitle) rankingView.append(nativeTitle);
  let columnHead = rankingView.querySelector(".boggle-end-ranking-columns-h9f2");
  if (!columnHead) columnHead = createEndRankingColumnsH9F2();
  rankingView.append(columnHead, panel.ranking);
  columnHead.hidden = daily;
  if (dailySection) rankingView.append(dailySection);

  let statsView = element.querySelector(".boggle-end-view-stats-h9f2");
  if (!statsView) {
    statsView = document.createElement("section");
    statsView.className = "boggle-end-view-stats-h9f2";
    statsView.setAttribute("aria-label", "Mes statistiques");
  }
  const stats = element.querySelector(".boggle-round-stats-h9e");
  if (stats) statsView.append(stats);

  let actions = element.querySelector(".boggle-end-actions-h9f2");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "boggle-end-actions-h9f2";
    const showStats = document.createElement("button");
    showStats.type = "button";
    showStats.className = "boggle-end-switch-h9f2 boggle-end-switch-primary-h9f2";
    showStats.dataset.endViewH9f2 = "stats";
    showStats.textContent = "Voir mes stats";
    const showRanking = document.createElement("button");
    showRanking.type = "button";
    showRanking.className = "boggle-end-switch-h9f2";
    showRanking.dataset.endViewH9f2 = "ranking";
    showRanking.textContent = "Retour au classement";
    const shareResult = document.createElement("button");
    shareResult.type = "button";
    shareResult.className = "boggle-end-switch-h9f2";
    shareResult.setAttribute("data-end-share-h9g", "");
    shareResult.textContent = "Partager mon résultat";
    shareResult.setAttribute("aria-live", "polite");
    actions.append(showStats, showRanking, shareResult);
  }

  // Keep the same illustrated header in the inline results and the modal.
  const heroCopy = element.id === "end-screen"
    ? ensureInlineEndHeroB1c7(element)
    : element.querySelector(":scope > .boggle-end-hero-b1c2 > .boggle-end-hero-copy-b1c2");
  if (heroCopy) heroCopy.append(panel.title, panel.message);
  else element.append(panel.title, panel.message);
  element.append(overview, panel.nextRound, rankingView, statsView, actions);
  const key = `${gameKey}:${solo ? "solo" : daily ? "daily" : "multi"}`;
  if (element.dataset.endGameH9f2 !== key) {
    element.dataset.endGameH9f2 = key;
    element.dataset.endViewH9f2 = solo ? "stats" : "ranking";
  }
  setEndScreenViewH9F2(element, element.dataset.endViewH9f2, solo);
}

export function setEndScreenViewH9F2(element, view, solo = false) {
  const normalized = solo ? "stats" : view === "stats" ? "stats" : "ranking";
  element.dataset.endViewH9f2 = normalized;
  const ranking = element.querySelector(".boggle-end-view-ranking-h9f2");
  const stats = element.querySelector(".boggle-end-view-stats-h9f2");
  if (ranking) ranking.hidden = normalized !== "ranking";
  if (stats) stats.hidden = normalized !== "stats";
  const actions = element.querySelector(".boggle-end-actions-h9f2");
  if (actions) {
    actions.hidden = false;
    for (const button of actions.querySelectorAll("[data-end-view-h9f2]")) {
      button.hidden = solo || button.dataset.endViewH9f2 === normalized;
    }
  }
}

/* H9e — une seule section de statistiques par panneau ; même rendu source et modale. */
function updateDetailedRoundStatsH9E(panel, options) {
  let section = panel.element.querySelector(".boggle-round-stats-h9e");
  if (!section) {
    section = document.createElement("section");
    section.className = "boggle-round-stats-h9e";
    section.setAttribute("aria-label", "Statistiques de la manche");
    section.innerHTML = `
      <h3>Statistiques</h3>
      <div class="h9e-metrics">
        <div><span>Score</span><strong data-h9e="score"></strong></div>
        <div><span>Mots trouvés</span><strong data-h9e="found"></strong></div>
        <div><span>Réussite</span><strong data-h9e="rate"></strong></div>
        <div><span>Durée</span><strong data-h9e="duration"></strong></div>
      </div>
      <h3>Mots par longueur</h3>
      <p class="h9e-chart-legend">
        <span class="h9e-legend-found">Trouvés</span>
        <span class="h9e-legend-possible">Possibles</span>
      </p>
      <div class="h9e-chart" role="group" aria-label="Comparaison des mots trouvés et possibles"></div>
      <details class="h9e-invalid">
        <summary>Mots erronés <span class="h9e-invalid-count"></span></summary>
        <div class="h9e-invalid-body"></div>
      </details>`;
    const anchor = panel.element.querySelector(".end-screen-extra-stats-h6a") || panel.stats;
    anchor.insertAdjacentElement("afterend", section);
  }

  const { currentPlayer, totalWords, durationSeconds, wordCountsByLength, foundWords, invalidWords } = options;
  const count = Number(currentPlayer?.wordCount ?? foundWords?.length ?? 0);
  const available = Number(totalWords);
  const text = (key, value) => {
    section.querySelector(`[data-h9e="${key}"]`).textContent = value;
  };
  text("score", `${Number(currentPlayer?.score ?? 0)} points`);
  text("found", String(count));
  text("rate", available > 0 ? `${(100 * count / available).toFixed(1).replace(".", ",")} %` : "—");
  text("duration", formatDuration(durationSeconds));

  const chart = section.querySelector(".h9e-chart");
  if (!Array.isArray(wordCountsByLength)) {
    chart.textContent = "Répartition en cours de chargement…";
  } else {
    const possible = new Map();
    for (const item of wordCountsByLength) {
      const length = Number(item?.length);
      const value = Number(item?.count);
      if (!Number.isInteger(length) || length < 3 || !Number.isFinite(value) || value < 0) continue;
      const bucket = Math.min(length, 8);
      possible.set(bucket, (possible.get(bucket) || 0) + value);
    }
    const found = new Map();
    for (const item of Array.isArray(foundWords) ? foundWords : []) {
      const word = typeof item === "string" ? item : item?.word;
      if (typeof word !== "string" || word.length < 3) continue;
      const bucket = Math.min(word.length, 8);
      found.set(bucket, (found.get(bucket) || 0) + 1);
    }
    const max = Math.max(1, ...possible.values());
    const rows = [];
    for (let length = 3; length <= 8; length++) {
      const label = length === 8 ? "8+" : String(length);
      const valid = found.get(length) || 0;
      const all = possible.get(length) || 0;
      const row = document.createElement("div");
      row.className = "h9e-chart-row";
      row.setAttribute("role", "img");
      row.setAttribute("aria-label", `${label} lettres : ${valid} trouvés sur ${all} possibles`);
      const heading = document.createElement("span");
      heading.className = "h9e-chart-length";
      heading.textContent = label;
      const bars = document.createElement("div");
      bars.className = "h9e-chart-bars";
      for (const [kind, amount] of [["possible", all], ["found", valid]]) {
        const track = document.createElement("div");
        track.className = "h9e-chart-track";
        const bar = document.createElement("span");
        bar.className = `h9e-chart-bar h9e-chart-bar-${kind}`;
        bar.style.width = `${100 * amount / max}%`;
        track.append(bar);
        bars.append(track);
      }
      const numbers = document.createElement("span");
      numbers.className = "h9e-chart-numbers";
      numbers.textContent = `${valid} / ${all}`;
      row.append(heading, bars, numbers);
      rows.push(row);
    }
    chart.replaceChildren(...rows);
  }

  const invalidBody = section.querySelector(".h9e-invalid-body");
  const invalidCount = section.querySelector(".h9e-invalid-count");
  if (!Array.isArray(invalidWords)) {
    invalidCount.textContent = "";
    invalidBody.textContent = "Liste en cours de récupération…";
  } else {
    invalidCount.textContent = `(${invalidWords.length})`;
    if (!invalidWords.length) {
      invalidBody.textContent = "Aucun mot erroné.";
    } else {
      const list = document.createElement("ul");
      for (const word of invalidWords) {
        const item = document.createElement("li");
        item.textContent = word;
        list.append(item);
      }
      invalidBody.replaceChildren(list);
    }
  }
}
