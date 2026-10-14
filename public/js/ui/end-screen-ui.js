export function renderEndScreen(anchorElement, options) {
  const {
    players,
    currentPlayerId,
    maxScore,
    totalWords,
    durationSeconds,
        invalidCount = 0,
    helpLevel = 0,
    restartMessage = "",
  } = options;

  const panel = ensureEndScreen(anchorElement);
  const sortedPlayers = [...players].sort(sortPlayers);
  const currentPlayer = sortedPlayers.find((player) => player.id === currentPlayerId);
  const winnerScore = sortedPlayers[0]?.score ?? 0;
  const winners = sortedPlayers.filter((player) => player.score === winnerScore);
  const hasMultiplePlayers = sortedPlayers.length > 1;

  panel.element.hidden = false;
  panel.title.textContent = "Fin de partie";

  if (!currentPlayer) {
    panel.message.textContent = "La partie est terminée.";
  } else if (!hasMultiplePlayers) {
    panel.message.textContent =
      `Vous terminez avec ${currentPlayer.score} point(s) et ${currentPlayer.wordCount} mot(s).`;
  } else if (currentPlayer.score === winnerScore && winners.length === 1) {
    panel.message.textContent = "Vous avez gagné 🎉";
  } else if (currentPlayer.score === winnerScore && winners.length > 1) {
    panel.message.textContent = "Égalité en tête 🤝";
  } else {
    panel.message.textContent = "Vous avez perdu cette manche.";
  }

  panel.stats.textContent =
    `Grille : ${totalWords ?? 0} mot(s) possible(s), ` +
    `${maxScore ?? 0} point(s) maximum, ` +
    `durée ${formatDuration(durationSeconds)}.`;

  
  updateEndScreenExtraStatsH6A(panel, currentPlayer, invalidCount, helpLevel);

  panel.nextRound.textContent = restartMessage;
  panel.nextRound.hidden = !restartMessage;

  panel.ranking.innerHTML = "";

  sortedPlayers.forEach((player, index) => {
    const item = document.createElement("li");
    const isCurrentPlayer = player.id === currentPlayerId;
    const isWinner = player.score === winnerScore && winnerScore > 0;

    item.classList.add("boggle-end-ranking-item");
    item.classList.toggle("boggle-end-ranking-item-current", isCurrentPlayer);

    const rank = index + 1;
    const trophy = isWinner ? " 🏆" : "";
    const you = isCurrentPlayer ? " — vous" : "";

    item.textContent =
      `${rank}. ${player.name}${you}${trophy} — ` +
      `${player.score} point(s), ${player.wordCount} mot(s)`;

    panel.ranking.appendChild(item);
  });
}

export function hideEndScreen() {
  const panel = document.querySelector("#end-screen");

  if (panel) {
    panel.hidden = true;
  }
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
    rankingTitle.textContent = "Classement";

    const ranking = document.createElement("ol");
    ranking.id = "end-screen-ranking";

    panel.append(title, message, stats, nextRound, rankingTitle, ranking);
    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    element: panel,
    title: panel.querySelector("#end-screen-title"),
    message: panel.querySelector("#end-screen-message"),
    stats: panel.querySelector("#end-screen-stats"),
    nextRound: panel.querySelector("#end-screen-next-round"),
    ranking: panel.querySelector("#end-screen-ranking"),
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
  const invalidLabel = `${invalidCount} erreur${invalidCount > 1 ? "s" : ""}`;

  extraStats.hidden = false;
  extraStats.textContent =
    `Erreurs : ${invalidLabel}. Aide utilisée : ${formatHelpLevelH6A(helpLevel)}.`;
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
    Math.min(3, Math.round(Number(helpLevel ?? 0)))
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
