import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { askMeAnything } from '../../../../ai/generateWritingFeedback';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	sentence: z.string().optional(),
	word: z.string(),
	question: z.string()
});

export const POST: ServerLoad = async ({ request }) => {
	const params = postSchema.parse(await request.json());

	return json(await askMeAnything(params));
};
