import { GameStatus } from "../game/game-state";
import { Board, GameMode, GameOptions, Player } from "./types";

export type ClientMessage =
  | {
      type: "join";
      name: string;
      clientId?: string;
    }
  | {
      type: "startGame";
      mode?: GameMode;
      board?: Board;
      options?: Partial<GameOptions>;
    }
  | {
      type: "updateGameOptions";
      options: Partial<GameOptions>;
    }
  | {
      type: "endGame";
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
      type: "gameOptionsUpdated";
      gameOptions: GameOptions;
    }
  | {
      type: "gameStatus";
      status: GameStatus;
    }
  | {
      type: "gameStarted";
      status: "playing";
      mode: GameMode;
      gameOptions: GameOptions;
      board: Board;
      startedAt: number;
      durationSeconds: number;
    }
  | {
      type: "gameEnded";
      status: "ended";
      mode: GameMode;
      gameOptions: GameOptions;
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
      reasonCode?: "invalid" | "duplicate" | "taken" | "tooShort" | "notPlaying" | "boardUnavailable";
      penalty?: number;
      score?: number;
      invalidCount?: number;
    }
  | {
      type: "solutionsStats";
      totalWords: number;
      maxScore: number;
      cellCounts: number[][];
      cellWords: string[][][];
      solveDurationMs: number;
    };
