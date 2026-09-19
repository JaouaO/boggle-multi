import type { Board } from "../shared/types";

const LETTERS = [
	"A", "A", "A", "A", "A", "A", "A", "A", "A",
	"E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E", "E",
	"I", "I", "I", "I", "I", "I", "I",
	"O", "O", "O", "O", "O",
	"U", "U", "U", "U",
	"Y",

	"B", "B",
	"C", "C", "C", "C",
	"D", "D", "D",
	"F", "F",
	"G", "G",
	"H",
	"J",
	"K",
	"L", "L", "L", "L", "L",
	"M", "M", "M",
	"N", "N", "N", "N", "N", "N",
	"P", "P", "P",
	"Q",
	"R", "R", "R", "R", "R", "R",
	"S", "S", "S", "S", "S", "S",
	"T", "T", "T", "T", "T", "T",
	"V", "V",
	"W",
	"X",
	"Z",
];

export function generateBoard(size = 4): Board {
	const board: Board = [];

	for (let row = 0; row < size; row++) {
		const line: string[] = [];

		for (let col = 0; col < size; col++) {
			line.push(randomItem(LETTERS));
		}

		board.push(line);
	}

	return board;
}

function randomItem<T>(items: T[]): T {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);

	return items[array[0] % items.length];
}
