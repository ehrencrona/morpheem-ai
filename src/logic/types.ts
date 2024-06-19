import { z } from 'zod';
import * as DB from '../db/types';

export interface Language {
	code: 'pl' | 'fr' | 'es' | 'ko';
	name: string;
	schema: string;
	isLatin: boolean;
}

export interface AlphaBeta {
	readonly alpha: number;
	readonly beta: number | null;
}

export type ExerciseType = 'read' | 'write' | 'cloze' | 'translate' | 'cloze-inflection';

export const wordKnowledgeSchema = z.object({
	wordId: z.number(),
	sentenceId: z.number().optional(),
	userId: z.number(),
	isKnown: z.boolean(),
	studiedWordId: z.number().optional(),
	type: z.number()
});

export type WordKnowledge = z.infer<typeof wordKnowledgeSchema>;

export const exerciseKnowledgeSchema = z.object({
	sentenceId: z.number(),
	wordId: z.number().nullable(),
	word: z.string().nullable(),
	exercise: z.enum(['read', 'write', 'cloze', 'translate', 'cloze-inflection']),
	isKnown: z.boolean(),
	level: z.number()
});

export type ExerciseKnowledge = z.infer<typeof exerciseKnowledgeSchema>;

export interface SentenceWord extends DB.Word {
	word_index: number;
}

export interface CandidateSentenceWithWords extends DB.Sentence {
	words: SentenceWord[];
	lastSeen: number | undefined;
}
