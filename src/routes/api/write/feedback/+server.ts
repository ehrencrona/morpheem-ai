import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateWritingFeedback } from '../../../../ai/generateWritingFeedback';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	sentence: z.string(),
	word: z.string()
});

export const POST: ServerLoad = async ({ request }) => {
	const { sentence, word } = postSchema.parse(await request.json());

	return json(await generateWritingFeedback(sentence, word));
};
