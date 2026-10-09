export function normalizeBoardTextForTextarea(value) {
  return String(value || "")
    .trim()
    .replace(/\s*[\\/|;]+\s*/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, "").toUpperCase())
    .filter(Boolean)
    .join("\n");
}

export function formatBoardForTextarea(board) {
  if (typeof board === "string") {
    return normalizeBoardTextForTextarea(board);
  }

  if (!Array.isArray(board)) {
    return "";
  }

  return normalizeBoardTextForTextarea(
    board
      .map((row) => Array.isArray(row) ? row.join("") : String(row || ""))
      .filter(Boolean)
      .join("\n")
  );
}
