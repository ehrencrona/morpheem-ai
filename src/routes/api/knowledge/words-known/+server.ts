import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { storeWordsKnown } from '../../../../db/wordsKnown';
import { userId } from '../../../../logic/user';

export const POST: ServerLoad = async ({ request }) => {
	let { read, write } = z
		.object({
			read: z.number(),
			write: z.number()
		})
		.parse(await request.json());

	await storeWordsKnown({ userId, read, write });

	return json({});
};
