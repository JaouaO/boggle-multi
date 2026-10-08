export function renderEndScreen(anchorElement, options) {
  const {
    players,
    currentPlayerId,
    maxScore,
    totalWords,
    durationSeconds,
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

  panel.ranking.innerHTML = "";

  sortedPlayers.forEach((player, index) => {
    const item = document.createElement("li");
    const isCurrentPlayer = player.id === currentPlayerId;
    const isWinner = player.score === winnerScore && winnerScore > 0;

    item.style.margin = "0.35rem 0";
    item.style.fontWeight = isCurrentPlayer ? "700" : "400";

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
    panel.style.marginTop = "1rem";
    panel.style.padding = "1rem";
    panel.style.border = "2px solid #222";
    panel.style.borderRadius = "0.75rem";
    panel.style.background = "#f7f7f7";

    const title = document.createElement("h2");
    title.id = "end-screen-title";
    title.style.marginTop = "0";

    const message = document.createElement("p");
    message.id = "end-screen-message";
    message.style.fontWeight = "700";

    const stats = document.createElement("p");
    stats.id = "end-screen-stats";

    const rankingTitle = document.createElement("h3");
    rankingTitle.textContent = "Classement";

    const ranking = document.createElement("ol");
    ranking.id = "end-screen-ranking";

    panel.append(title, message, stats, rankingTitle, ranking);
    anchorElement.insertAdjacentElement("afterend", panel);
  }

  return {
    element: panel,
    title: panel.querySelector("#end-screen-title"),
    message: panel.querySelector("#end-screen-message"),
    stats: panel.querySelector("#end-screen-stats"),
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

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}min ${remainingSeconds}s`;
}
