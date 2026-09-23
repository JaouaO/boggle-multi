import type { Board } from "../shared/types";

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

export function isWordOnBoard(word: string, board: Board) {
	if (!word || word.length < 3) {
		return false;
	}

	const normalizedWord = normalizeWord(word);

	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[row].length; col++) {
			if (board[row][col] === normalizedWord[0]) {
				const visited = createVisitedBoard(board);

				if (searchWord(normalizedWord, board, row, col, 0, visited)) {
					return true;
				}
			}
		}
	}

	return false;
}

export function normalizeWord(word: string) {
	return word
		.trim()
		.toLocaleUpperCase("fr-FR")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^A-Z]/g, "");
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

	if (board[row][col] !== word[index]) {
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
