import { z } from 'zod';
import * as DB from '../db/types';

export type LanguageCode = 'pl' | 'fr' | 'es' | 'ko' | 'nl' | 'ru' | 'sv';

export interface Language {
	code: LanguageCode;
	name: string;
	schema: string;
	isLatin: boolean;
}

export interface AlphaBeta {
	readonly alpha: number;
	readonly beta: number | null;
}

export type ExerciseType =
	| 'read'
	| 'write'
	| 'cloze'
	| 'phrase-cloze'
	| 'translate'
	| 'cloze-inflection';

export const wordKnowledgeSchema = z.object({
	wordId: z.number(),
	sentenceId: z.number().optional(),
	userId: z.number(),
	isKnown: z.boolean(),
	studiedWordId: z.number().optional(),
	type: z.number()
});

export type WordKnowledge = z.infer<typeof wordKnowledgeSchema>;

export const exerciseKnowledgeSchema = DB.exerciseSchema.and(
	z.object({
		isKnown: z.boolean(),
		level: z.number()
	})
);

export type ExerciseKnowledge = DB.Exercise & {
	isKnown: boolean;
	level: number;
};

export interface SentenceWord extends DB.Word {
	word_index: number;
}

export interface CandidateSentenceWithWords extends DB.Sentence {
	words: SentenceWord[];
	lastSeen: number | undefined;
}
