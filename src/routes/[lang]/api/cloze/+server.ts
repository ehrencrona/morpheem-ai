import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { evaluateCloze } from '../../../../logic/evaluateCloze';

const postSchema = z.object({
	cloze: z.string(),
	clue: z.string(),
	userAnswer: z.string(),
	correctAnswer: z.string(),
	isWrongInflection: z.boolean()
});

export type PostSchema = z.infer<typeof postSchema>;

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	const query = postSchema.parse(await request.json());

	return json(await evaluateCloze(query, { language }));
};
