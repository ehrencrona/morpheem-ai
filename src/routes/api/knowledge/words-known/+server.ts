import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { storeWordsKnown } from '../../../../db/wordsKnown';
import { userId } from '../../../../logic/user';

export const POST: ServerLoad = async ({ request }) => {
	let { wordsKnown } = z
		.object({
			wordsKnown: z.number()
		})
		.parse(await request.json());

	await storeWordsKnown(userId, wordsKnown);

	return json({});
};
