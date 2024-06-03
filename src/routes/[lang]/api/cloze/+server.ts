import { ServerLoad, json } from '@sveltejs/kit';
import { evaluateCloze } from '../../../../ai/evaluateCloze';
import { z } from 'zod';

const postSchema = z.object({
	cloze: z.string(),
	clue: z.string(),
	userAnswer: z.string(),
	correctAnswer: z.string(),
	isWrongInflection: z.boolean()
});

export type PostSchema = z.infer<typeof postSchema>;

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	return json(await evaluateCloze(postSchema.parse(await request.json()), { language }));
};
