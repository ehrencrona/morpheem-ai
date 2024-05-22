import { z } from 'zod';
import * as DB from '../db/types';

export interface AlphaBeta {
	readonly alpha: number;
	readonly beta: number | null;
}

export const wordKnowledgeSchema = z.object({
	wordId: z.number(),
	sentenceId: z.number().optional(),
	userId: z.number(),
	isKnown: z.boolean(),
	studiedWordId: z.number(),
	type: z.number()
});

export type WordKnowledge = z.infer<typeof wordKnowledgeSchema>;

export interface AggKnowledgeForUser {
	wordId: number;
	alpha: number;
	beta: number | null;
	time: number;
	level: number;
	word: string;
	studied?: false;
}

export interface SentenceWord extends DB.Word {
	word_index: number;
}

export interface CandidateSentenceWithWords extends DB.Sentence {
	words: SentenceWord[];
	lastSeen: number | undefined;
}
