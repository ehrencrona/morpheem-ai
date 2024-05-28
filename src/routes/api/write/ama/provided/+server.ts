import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { findProvidedWordsInAnswer } from '../../../../../logic/findProvidedWordsInAnswer';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	question: z.string(),
	answer: z.string()
});

export const POST: ServerLoad = async ({ request, locals }) => {
	const params = postSchema.parse(await request.json());
	const { language } = locals;

	return json(await findProvidedWordsInAnswer({ ...params, userId: locals.user!.num, language }));
};
