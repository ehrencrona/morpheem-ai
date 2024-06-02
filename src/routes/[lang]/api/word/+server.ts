import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getMultipleWordsByIds } from '../../../../db/words';

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	let wordIds = z.array(z.number()).parse(await request.json());

	return json(await getMultipleWordsByIds(wordIds, language));
};
