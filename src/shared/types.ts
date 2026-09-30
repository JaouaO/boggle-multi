export type Board = string[][];

export type GameMode = "timed" | "solution";

export type GameDurationMode = "timer" | "noTimer" | "targetScore";

export type TargetScoreMode = "percentOfMaxScore" | "fixedScore";

export type GameOptions = {
  durationMode: GameDurationMode;
  durationSeconds: number;
  uniqueWords: boolean;
  penalizeInvalidWords: boolean;
  invalidWordPenalty: number;
  maxHelpLevel: number;
  targetScoreMode: TargetScoreMode;
  targetScorePercent: number;
  targetScore: number;
  soundEnabled: boolean;
  masterVolume: number;
  visualEffectsEnabled: boolean;
};

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
