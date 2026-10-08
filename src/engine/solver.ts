import { getDictionaryTrie } from "./dictionary";
import { normalizeWord } from "./normalization";
import { scoreWord } from "../game/scoring";
import { Board, BoardPosition, BoardSolution } from "../shared/types";
import { TrieNode } from "./trie";

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

type FoundSolution = BoardSolution & {
  cellKeys: Set<string>;
};

export function isWordOnBoard(word: string, board: Board) {
  if (!word || word.length < 3) {
    return false;
  }

  const normalizedWord = normalizeWord(word);

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (normalizeBoardLetter(board[row][col]) !== normalizedWord[0]) {
        continue;
      }

      const visited = createVisitedBoard(board);

      if (searchWord(normalizedWord, board, row, col, 0, visited)) {
        return true;
      }
    }
  }

  return false;
}

export function findAllWordsOnBoard(board: Board) {
  const root = getDictionaryTrie();
  const foundSolutions = new Map<string, FoundSolution>();

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const letter = normalizeBoardLetter(board[row][col]);
      const nextNode = root.children[letter];

      if (!nextNode) {
        continue;
      }

      const visited = createVisitedBoard(board);

      searchSolutions(
        board,
        row,
        col,
        nextNode,
        visited,
        [{ row, col }],
        foundSolutions
      );
    }
  }

  return [...foundSolutions.values()]
    .map(({ cellKeys, ...solution }) => solution)
    .sort(sortSolutions);
}

export function createCellSolutionCounts(
  board: Board,
  solutions: BoardSolution[]
) {
  const counts = board.map((row) => row.map(() => 0));

  for (const solution of solutions) {
    for (const cell of solution.cells) {
      counts[cell.row][cell.col]++;
    }
  }

  return counts;
}

export function createCellSolutionWords(
  board: Board,
  solutions: BoardSolution[]
) {
  const wordsByCell = board.map((row) => row.map(() => new Set<string>()));

  for (const solution of solutions) {
    for (const cell of solution.cells) {
      wordsByCell[cell.row][cell.col].add(solution.word);
    }
  }

  return wordsByCell.map((row) =>
    row.map((words) => [...words].sort(sortWords))
  );
}

export function getMaxScore(solutions: BoardSolution[]) {
  return solutions.reduce((total, solution) => total + solution.score, 0);
}

function searchSolutions(
  board: Board,
  row: number,
  col: number,
  node: TrieNode,
  visited: boolean[][],
  path: BoardPosition[],
  foundSolutions: Map<string, FoundSolution>
) {
  if (visited[row][col]) {
    return;
  }

  visited[row][col] = true;

  if (node.word && node.word.length >= 3) {
    registerSolution(node.word, path, foundSolutions);
  }

  for (const [rowOffset, colOffset] of DIRECTIONS) {
    const nextRow = row + rowOffset;
    const nextCol = col + colOffset;

    if (!isInsideBoard(board, nextRow, nextCol)) {
      continue;
    }

    if (visited[nextRow][nextCol]) {
      continue;
    }

    const nextLetter = normalizeBoardLetter(board[nextRow][nextCol]);
    const nextNode = node.children[nextLetter];

    if (!nextNode) {
      continue;
    }

    searchSolutions(
      board,
      nextRow,
      nextCol,
      nextNode,
      visited,
      [...path, { row: nextRow, col: nextCol }],
      foundSolutions
    );
  }

  visited[row][col] = false;
}

function registerSolution(
  word: string,
  path: BoardPosition[],
  foundSolutions: Map<string, FoundSolution>
) {
  const existingSolution = foundSolutions.get(word);

  if (!existingSolution) {
    const cellKeys = new Set(path.map(getCellKey));

    foundSolutions.set(word, {
      word,
      score: scoreWord(word),
      path: [...path],
      cells: [...path],
      cellKeys,
    });

    return;
  }

  for (const cell of path) {
    const cellKey = getCellKey(cell);

    if (!existingSolution.cellKeys.has(cellKey)) {
      existingSolution.cellKeys.add(cellKey);
      existingSolution.cells.push(cell);
    }
  }
}

function searchWord(
  word: string,
  board: Board,
  row: number,
  col: number,
  index: number,
  visited: boolean[][]
): boolean {
  if (!isInsideBoard(board, row, col)) {
    return false;
  }

  if (visited[row][col]) {
    return false;
  }

  if (normalizeBoardLetter(board[row][col]) !== word[index]) {
    return false;
  }

  if (index === word.length - 1) {
    return true;
  }

  visited[row][col] = true;

  for (const [rowOffset, colOffset] of DIRECTIONS) {
    const nextRow = row + rowOffset;
    const nextCol = col + colOffset;

    if (searchWord(word, board, nextRow, nextCol, index + 1, visited)) {
      return true;
    }
  }

  visited[row][col] = false;

  return false;
}

function isInsideBoard(board: Board, row: number, col: number) {
  return row >= 0 && row < board.length && col >= 0 && col < board[row].length;
}

function createVisitedBoard(board: Board) {
  return board.map((row) => row.map(() => false));
}

function normalizeBoardLetter(letter: string) {
  return normalizeWord(letter)[0] ?? "";
}

function getCellKey(cell: BoardPosition) {
  return `${cell.row}:${cell.col}`;
}

function sortSolutions(a: BoardSolution, b: BoardSolution) {
  if (a.word.length !== b.word.length) {
    return a.word.length - b.word.length;
  }

  return sortWords(a.word, b.word);
}

function sortWords(a: string, b: string) {
  if (a.length !== b.length) {
    return a.length - b.length;
  }

  return a.localeCompare(b, "fr");
}
