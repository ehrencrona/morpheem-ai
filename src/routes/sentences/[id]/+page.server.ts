import { type ServerLoad } from '@sveltejs/kit';
import { getWordsOfSentence } from '../../../db/words';
import { getSentence } from '../../../db/sentences';

export const load = (async ({ params }) => {
	const sentenceId = parseInt(params.id!);

	return {
		sentence: await getSentence(sentenceId),
		lemmas: await getWordsOfSentence(sentenceId)
	};
}) satisfies ServerLoad;
