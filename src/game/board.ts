import { Board, BoardSize } from "../shared/types";

/* Dés officiels 4×4 utilisés jusque-là. */
const dice4x4 = [
  "ETUKNO", "EVGTIN", "DECAMP", "IELRUW",
  "EHIFSE", "RECALS", "ENTDOS", "OFXRIA",
  "NAVEDZ", "EIOATA", "GLENYU", "BMAQJO",
  "TLIBRA", "SPULTE", "AIMSOR", "ENHRIS",
];

/*
 * Extension 5×5 reprise de la version solo.
 * Elle conserve des dés à fréquence française et évite des suites trop absurdes.
 */
const dice5x5 = [
  ...dice4x4,
  "AEIOUY", "SPULTE",
  "RECALS", "BMAQJO",
  "DECAMP", "WXYZEA",
  "ERISPN", "TLIBRA",
  "GLENYU",
];

function shuffle<T>(values: T[]) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function getDice(size: BoardSize) {
  if (size === 3) {
    return shuffle(dice4x4).slice(0, 9);
  }

  if (size === 5) {
    return dice5x5;
  }

  return dice4x4;
}

function randomDieLetter(die: string) {
  return die[Math.floor(Math.random() * die.length)];
}

export function normalizeBoardSize(value: unknown): BoardSize {
  const size = Number(value);

  if (size === 3 || size === 5) {
    return size;
  }

  return 4;
}

export function generateBoard(sizeValue: unknown = 4): Board {
  const size = normalizeBoardSize(sizeValue);
  const dice = shuffle(getDice(size));
  const board: Board = [];

  for (let row = 0; row < size; row++) {
    const boardRow: string[] = [];

    for (let col = 0; col < size; col++) {
      const die = dice[row * size + col];
      boardRow.push(randomDieLetter(die));
    }

    board.push(boardRow);
  }

  return board;
}
