import { json, type ServerLoad } from '@sveltejs/kit';
import { Word } from '../../../../../../db/types';
import { getWordById, getWordByLemma } from '../../../../../../db/words';
import { findRelatedWords } from '../../../../../../logic/relatedWords';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	let wordId = parseInt(params.id!);

	let word: Word;

	if (isNaN(wordId)) {
		word = await getWordByLemma(params.id!, language);
	} else {
		word = await getWordById(wordId, language);
	}

	return json(await findRelatedWords(word, language));
};
