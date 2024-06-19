import { json, type ServerLoad } from '@sveltejs/kit';
import { getInflections } from '../../../../../../db/lemmas';
import { getWordByLemma } from '../../../../../../db/words';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	let wordId = parseInt(params.id!);

	if (isNaN(wordId)) {
		wordId = (await getWordByLemma(params.id!, language)).id;
	}

	return json(await getInflections(wordId, language));
};
