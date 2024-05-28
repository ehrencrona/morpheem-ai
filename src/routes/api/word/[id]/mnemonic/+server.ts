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
	const { language } = locals;
	const generate = url.searchParams.has('generate');

	const wordId = parseInt(params.id!);

	const word = await getWordById(wordId, language);

	return json(
		generate
			? await generateMnemonic(word, userId, locals.user!.languages, language, true)
			: await getMnemonic({ wordId, userId, language })
	);
};

export const PUT: ServerLoad = async ({ request, params, locals }) => {
	let { mnemonic } = postSchema.parse(await request.json());
	const { language } = locals;

	const wordId = parseInt(params.id!);
	const userId = locals.user!.num;

	await setMnemonic({ wordId, userId, mnemonic, language });

	return json({});
};
