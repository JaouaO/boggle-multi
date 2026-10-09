export function rankPlayers(players) {
  return [...players].sort((a, b) => {
    const scoreDiff = Number(b.score ?? 0) - Number(a.score ?? 0);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    const wordDiff = Number(b.wordCount ?? 0) - Number(a.wordCount ?? 0);

    if (wordDiff !== 0) {
      return wordDiff;
    }

    return String(a.name ?? "").localeCompare(String(b.name ?? ""), "fr");
  });
}

export function normalizeComparableWord(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .toUpperCase();
}

export function normalizeFoundWordsForDisplay(words) {
  return [...(words || [])]
    .map((item) => ({
      word: String(item.word || "").toUpperCase(),
      points: Number(item.points ?? 0),
      path: Array.isArray(item.path) ? item.path : [],
    }))
    .filter((item) => item.word);
}

export function getFoundWordScoreClass(points) {
  const score = Number(points ?? 0);

  if (score >= 11) {
    return "11";
  }

  if (score >= 5) {
    return "5";
  }

  if (score >= 3) {
    return "3";
  }

  if (score >= 2) {
    return "2";
  }

  return "1";
}
