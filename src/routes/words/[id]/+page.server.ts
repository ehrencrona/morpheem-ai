import { type ServerLoad } from '@sveltejs/kit';
import { db } from '../../../db/client';
import { getWordById } from '../../../db/words';
import { getSentencesWithWord } from '../../../db/sentences';
import { getForms } from '../../../db/lemmas';

export const load = (async ({ params }) => {
	const wordId = parseInt(params.id!);

	const word = await getWordById(wordId);

	const sentences = await getSentencesWithWord(wordId);

	const forms = await getForms(wordId);

	return {
		sentences,
		word,
		forms
	};
}) satisfies ServerLoad;
