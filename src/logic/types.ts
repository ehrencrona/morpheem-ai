import { z } from 'zod';

export interface AlphaBeta {
	readonly alpha: number;
	readonly beta: number | null;
}

export const wordKnowledgeSchema = z.object({
	wordId: z.number(),
	sentenceId: z.number(),
	userId: z.number(),
	isKnown: z.boolean(),
	studiedWordId: z.number()
});

export type WordKnowledge = z.infer<typeof wordKnowledgeSchema>;

export interface AggKnowledgeForUser {
	wordId: number;
	alpha: number;
	beta: number;
	time: number;
	level: number;
}
