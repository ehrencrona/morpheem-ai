export interface Sentence {
	sentence: string;
	id: number;
	english: string | null;
}

export interface Word {
	word: string;
	id: number;
	level: number;
	cognate: boolean | null;
}
