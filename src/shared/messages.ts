import { GameStatus } from "../game/game-state";
import { Board, GameMode, Player } from "./types";

export type ClientMessage =
  | {
      type: "join";
      name: string;
    }
  | {
      type: "startGame";
      mode?: GameMode;
      board?: Board;
    }
  | {
      type: "submitWord";
      word: string;
    };

export type ServerMessage =
  | {
      type: "connected";
      roomId: string;
      playerId: string;
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
      mode: GameMode;
      board: Board;
      startedAt: number;
      durationSeconds: number;
    }
  | {
      type: "gameEnded";
      status: "ended";
      mode: GameMode;
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
