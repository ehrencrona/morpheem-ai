import { json, type ServerLoad } from '@sveltejs/kit';
import { getWordById } from '../../../../../db/words';
import { generateMnemonic } from '../../../../../logic/generateMnemonic';
import { z } from 'zod';
import { setMnemonic } from '../../../../../db/mnemonics';
import { userId } from '../../../../../logic/user';

const postSchema = z.object({
	mnemonic: z.string()
});

export const POST: ServerLoad = async ({ params, url }) => {
	const force = url.searchParams.has('force');

	const wordId = parseInt(params.id!);

	const word = await getWordById(wordId);

	return json(await generateMnemonic(word, force));
};

export const PUT: ServerLoad = async ({ request, params }) => {
	let { mnemonic } = postSchema.parse(await request.json());
	const wordId = parseInt(params.id!);

	await setMnemonic({ wordId, userId, mnemonic });

	return json({});
};
