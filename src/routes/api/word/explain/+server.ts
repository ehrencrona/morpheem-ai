import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { explain } from '../../../../ai/translate';

const postSchema = z.object({
	word: z.string()
});

export const POST: ServerLoad = async ({ request }) => {
	let { word: wordString } = postSchema.parse(await request.json());

	return json(await explain(wordString));
};
