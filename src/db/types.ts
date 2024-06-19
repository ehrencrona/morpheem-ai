import { ExerciseType } from '../logic/types';

export interface Sentence {
	sentence: string;
	id: number;
	english: string | null;
	transliteration: string | null;
}

export interface Word {
	word: string;
	id: number;
	level: number;
	cognate: boolean | null;
}

export interface Knowledge {
	alpha: number;
	beta: number | null;
	lastTime: number;
}

export interface Scoreable extends Knowledge {
	level: number;
}

export type ExerciseSource = 'unstudied' | 'studied' | 'userExercise';

export interface AggKnowledgeForUser extends Scoreable {
	wordId: number;
	word: string;
	source: ExerciseSource;
}

export interface UserExercise extends Scoreable {
	sentenceId: number;
	wordId: number | null;
	word: string | null;
	exercise: ExerciseType;
}
