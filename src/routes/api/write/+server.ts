import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { storeWrittenSentence } from '../../../logic/storeWrittenSentence';

const postSchema = z.object({
	sentence: z.string(),
	wordId: z.number(),
	unknownWordIds: z.array(z.number())
});

export type PostSchema = z.infer<typeof postSchema>;

export const POST: ServerLoad = async ({ request, locals }) => {
	const body = postSchema.parse(await request.json());
	const userId = locals.user!.num;
	const { language } = locals;

	await storeWrittenSentence({ ...body, userId, language });

	return json({});
};
