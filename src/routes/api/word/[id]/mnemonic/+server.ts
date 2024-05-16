import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { generateMnemonic } from '../../../../../ai/generateMnemonic';
import { getWordById } from '../../../../../db/words';

export const GET: ServerLoad = async ({ params }) => {
	const wordId = parseInt(params.id!);

	const word = await getWordById(wordId);

	return json(await generateMnemonic(word.word));
};
