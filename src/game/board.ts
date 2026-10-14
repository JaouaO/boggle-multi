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

/* G4C-SEEDED-DAILY-BOARD START */
type RandomSourceG4C = () => number;

function hashSeedG4C(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

function createSeededRandomG4C(seed: string): RandomSourceG4C {
  let value = hashSeedG4C(seed);

  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;

    return (value >>> 0) / 4294967296;
  };
}

function randomUnitG4C(random: RandomSourceG4C) {
  const value = Number(random());

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(0.999999999999, Math.max(0, value));
}
/* G4C-SEEDED-DAILY-BOARD END */

function shuffle<T>(values: T[], random: RandomSourceG4C = Math.random) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(randomUnitG4C(random) * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function getDice(size: BoardSize, random: RandomSourceG4C = Math.random) {
  if (size === 3) {
    return shuffle(dice4x4, random).slice(0, 9);
  }

  if (size === 5) {
    return dice5x5;
  }

  return dice4x4;
}

function randomDieLetter(die: string, random: RandomSourceG4C = Math.random) {
  return die[Math.floor(randomUnitG4C(random) * die.length)];
}

export function normalizeBoardSize(value: unknown): BoardSize {
  const size = Number(value);

  if (size === 3 || size === 5) {
    return size;
  }

  return 4;
}

export function generateBoard(sizeValue: unknown = 4, random: RandomSourceG4C = Math.random): Board {
  const size = normalizeBoardSize(sizeValue);
  const dice = shuffle(getDice(size, random), random);
  const board: Board = [];

  for (let row = 0; row < size; row++) {
    const boardRow: string[] = [];

    for (let col = 0; col < size; col++) {
      const die = dice[row * size + col];
      boardRow.push(randomDieLetter(die, random));
    }

    board.push(boardRow);
  }

  return board;
}

export function generateSeededBoard(seed: string, sizeValue: unknown = 4): Board {
  return generateBoard(sizeValue, createSeededRandomG4C(String(seed || "daily")));
}
