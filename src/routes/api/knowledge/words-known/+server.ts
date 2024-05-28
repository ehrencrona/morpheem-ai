import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { storeWordsKnown } from '../../../../db/wordsKnown';

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	let { read, write } = z
		.object({
			read: z.number(),
			write: z.number()
		})
		.parse(await request.json());

	await storeWordsKnown({ read, write, userId: userId!, language });

	return json({});
};
