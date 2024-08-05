import { error, json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { Word } from '../../../../db/types';
import { getMultipleWordsByLemmas } from '../../../../db/words';
import { addWords } from '../../../../logic/generateExampleSentences';

const postSchema = z.array(z.string());

export type PostSchema = z.infer<typeof postSchema>;

export type ResultSchema = Word[];

export const POST: ServerLoad = async ({ request, locals: { userId, language, isAdmin } }) => {
	if (!isAdmin) {
		return error(403, 'Forbidden');
	}

	let wordStrings = postSchema.parse(await request.json());

	const existingWords = await getMultipleWordsByLemmas(wordStrings, language);

	wordStrings = wordStrings.filter(
		(wordString) => !existingWords.some((word) => word.word == wordString)
	);

	const res = await addWords(wordStrings, language);

	return json(res satisfies ResultSchema);
};
