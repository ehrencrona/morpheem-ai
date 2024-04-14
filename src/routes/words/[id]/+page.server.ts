import { type ServerLoad } from '@sveltejs/kit';
import { getForms } from '../../../db/lemmas';
import { getSentencesWithWord } from '../../../db/sentences';
import { getWordById } from '../../../db/words';

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
