export type Board = string[][];

export type BoardPosition = {
  row: number;
  col: number;
};

export type BoardSolution = {
  word: string;
  score: number;
  path: BoardPosition[];
  cells: BoardPosition[];
};

export type Player = {
  id: string;
  name: string;
  score: number;
  wordCount: number;
};

export type Env = {
  BOGGLE_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
};
