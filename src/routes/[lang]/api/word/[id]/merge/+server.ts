import { error, json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getWordByLemma, mergeWordWith } from '../../../../../../db/words';

const postSchema = z.object({
	mergeWith: z.string()
});

export const POST: ServerLoad = async ({ request, params, locals: { isAdmin, language } }) => {
	if (!isAdmin) {
		return error(403, 'Forbidden');
	}

	const post = postSchema.parse(await request.json());
	const mergeWith = await getWordByLemma(post.mergeWith, language);

	const wordId = parseInt(params.id!);

	await mergeWordWith(wordId, mergeWith.id, language);

	return json({ toWordId: mergeWith.id });
};
