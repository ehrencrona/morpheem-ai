import { z } from 'zod';

export interface Gamma {
	readonly alpha: number;
	readonly beta: number;
}

export const wordKnowledgeSchema = z.object({
	wordId: z.number(),
	sentenceId: z.number(),
	userId: z.number(),
	isKnown: z.boolean()
});

export type WordKnowledge = z.infer<typeof wordKnowledgeSchema>;

export const aggKnowledgeForUserSchema = z.object({
	wordId: z.number(),
	alpha: z.number(),
	beta: z.number(),
	time: z.number()
});

export type AggKnowledgeForUser = z.infer<typeof aggKnowledgeForUserSchema>;
