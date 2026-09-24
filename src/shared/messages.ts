import { GameStatus } from "../game/game-state";
import { Board, Player } from "./types";

export type ClientMessage =
  | {
      type: "join";
      name: string;
    }
  | {
      type: "startGame";
    }
  | {
      type: "submitWord";
      word: string;
    };

export type ServerMessage =
  | {
      type: "connected";
      roomId: string;
    }
  | {
      type: "system";
      text: string;
    }
  | {
      type: "players";
      players: Player[];
    }
  | {
      type: "gameStatus";
      status: GameStatus;
    }
  | {
      type: "gameStarted";
      status: "playing";
      board: Board;
      startedAt: number;
      durationSeconds: number;
    }
  | {
      type: "gameEnded";
      status: "ended";
      board: Board;
      startedAt: number;
      durationSeconds: number;
      endedAt: number;
    }
  | {
      type: "wordAccepted";
      word: string;
      points: number;
      score: number;
    }
  | {
      type: "wordRejected";
      word: string;
      reason: string;
    }
  | {
      type: "solutionsStats";
      totalWords: number;
      maxScore: number;
      cellCounts: number[][];
      cellWords: string[][][];
      solveDurationMs: number;
    };
