import type { ServerLoad } from '@sveltejs/kit';
import { getWordsOfSentence } from '../../db/words';
import { getNextSentence } from '../../logic/getNextSentence';

export const load = (async ({}) => {
	const sentence = await getNextSentence();
	const sentenceId = sentence.id;

	const words = await getWordsOfSentence(sentenceId);

	return { sentence, words };
}) satisfies ServerLoad;
