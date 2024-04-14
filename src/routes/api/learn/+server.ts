import type { ServerLoad } from '@sveltejs/kit';
import { getWordsOfSentence } from '../../../db/words';
import { getNextSentence } from '../../../logic/getNextSentence';

export const GET: ServerLoad = async ({}) => {
	const sentence = await getNextSentence();
	const sentenceId = sentence.id;

	const words = await getWordsOfSentence(sentenceId);

	return new Response(JSON.stringify({ sentence, words }), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
