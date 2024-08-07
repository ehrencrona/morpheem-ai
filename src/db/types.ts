import { z } from 'zod';

export interface Sentence {
	sentence: string;
	id: number;
	english: string | null;
	transliteration: string | null;
	unit?: number;
}

export interface Word {
	word: string;
	id: number;
	level: number;
	type: WordType | undefined;
	unit?: number;
}

export type WordType = 'cognate' | 'name' | 'particle';

export interface Knowledge {
	alpha: number;
	beta: number | null;
	lastTime: number;
}

export interface Scoreable extends Knowledge {
	level: number;
}

export const exerciseSchema = z
	.object({
		id: z.number().nullable(),
		sentenceId: z.number()
	})
	.and(
		z
			.object({
				// todo rename to type
				exercise: z.enum(['read', 'write', 'cloze', 'cloze-inflection']),
				// TODO: rename to wordString
				word: z.string(),
				wordId: z.number()
			})
			.or(
				z.object({
					exercise: z.enum(['translate'])
				})
			)
			.or(
				z.object({
					exercise: z.literal('phrase-cloze'),
					phrase: z.string(),
					hint: z.string()
				})
			)
	);

export type Exercise = z.infer<typeof exerciseSchema>;

export type UserExercise = Exercise & Scoreable;

export type UserExerciseWithSentence = UserExercise & { sentence: Sentence };

export type ExerciseSource = 'unstudied' | 'studied' | 'userExercise' | 'related';

export type ScoreableExercise = Exercise &
	Scoreable & {
		source: ExerciseSource;
	};

export interface AggKnowledgeForUser extends Scoreable {
	wordId: number;
	word: string;
	wordType: WordType | undefined;
	source: ExerciseSource;
}

export interface Clause {
	sentence: string;
	english: string;
}
