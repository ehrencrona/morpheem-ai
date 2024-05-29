import { type ServerLoad } from '@sveltejs/kit';
import { getWordsOfSentence } from '../../../../db/words';
import { getSentence } from '../../../../db/sentences';

export const load: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.id!);

	return {
		sentence: await getSentence(sentenceId, language),
		lemmas: await getWordsOfSentence(sentenceId, language),
		languageCode: language.code
	};
};
