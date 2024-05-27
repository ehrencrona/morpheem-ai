import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { storeWordsKnown } from '../../../../db/wordsKnown';

export const POST: ServerLoad = async ({ request, locals }) => {
	let { read, write } = z
		.object({
			read: z.number(),
			write: z.number()
		})
		.parse(await request.json());

	await storeWordsKnown({ userId: locals.user!.num, read, write });

	return json({});
};
