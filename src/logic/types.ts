import { z } from 'zod';
import * as DB from '../db/types';

export interface Language {
	code: 'pl' | 'fr';
	name: string;
	schema: string;
}

export interface AlphaBeta {
	readonly alpha: number;
	readonly beta: number | null;
}

export type ExerciseType = 'read' | 'write' | 'cloze';

export const wordKnowledgeSchema = z.object({
	wordId: z.number(),
	sentenceId: z.number().optional(),
	userId: z.number(),
	isKnown: z.boolean(),
	studiedWordId: z.number().optional(),
	type: z.number()
});

export type WordKnowledge = z.infer<typeof wordKnowledgeSchema>;

export interface SentenceWord extends DB.Word {
	word_index: number;
}

export interface CandidateSentenceWithWords extends DB.Sentence {
	words: SentenceWord[];
	lastSeen: number | undefined;
}
