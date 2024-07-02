import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { evaluatePhraseCloze } from '../../../../ai/evaluatePhraseCloze';

const postSchema = z.object({
	cloze: z.string(),
	hint: z.string(),
	answered: z.string(),
	correctAnswer: z.string()
});

export type PostSchema = z.infer<typeof postSchema>;

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	const query = postSchema.parse(await request.json());

	return json(await evaluatePhraseCloze(query, { language }));
};
