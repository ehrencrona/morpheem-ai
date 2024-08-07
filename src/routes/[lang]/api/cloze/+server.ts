import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { evaluateCloze } from '../../../../logic/evaluateCloze';

const postSchema = z.object({
	cloze: z.string(),
	hint: z.string(),
	answered: z.string(),
	correctAnswer: z.object({ conjugated: z.string(), id: z.number(), word: z.string() }),
	isRightLemma: z.boolean()
});

export type PostSchema = z.infer<typeof postSchema>;

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	const query = postSchema.parse(await request.json());

	return json(await evaluateCloze(query, { language }));
};
