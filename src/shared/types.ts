export type Board = string[][];

export interface Env {
	BOGGLE_ROOM: DurableObjectNamespace;
	ASSETS: Fetcher;
}
