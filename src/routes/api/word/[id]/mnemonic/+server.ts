import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getMnemonic, setMnemonic } from '../../../../../db/mnemonics';
import { getWordById } from '../../../../../db/words';
import { generateMnemonic } from '../../../../../logic/generateMnemonic';

const postSchema = z.object({
	mnemonic: z.string()
});

export const POST: ServerLoad = async ({ params, url, locals }) => {
	const userId = locals.user!.num;
	const generate = url.searchParams.has('generate');

	const wordId = parseInt(params.id!);

	const word = await getWordById(wordId);

	return json(
		generate
			? await generateMnemonic(word, userId, locals.user!.languages, true)
			: await getMnemonic({ wordId, userId })
	);
};

export const PUT: ServerLoad = async ({ request, params, locals }) => {
	let { mnemonic } = postSchema.parse(await request.json());

	const wordId = parseInt(params.id!);
	const userId = locals.user!.num;

	await setMnemonic({ wordId, userId, mnemonic });

	return json({});
};
