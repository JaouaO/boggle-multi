export type Board = string[][];

export interface Player {
	id: string;
	name: string;
	score: number;
	wordCount: number;
}

export interface Env {
	BOGGLE_ROOM: DurableObjectNamespace;
	ASSETS: Fetcher;
}
