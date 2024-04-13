import { type ServerLoad } from '@sveltejs/kit';
import { getLemmasInSentence } from '../../../db/lemmas';
import { getSentence } from '../../../db/sentences';

export const load = (async ({ params }) => {
	const sentenceId = parseInt(params.id!);
	
	return {
		sentence: await getSentence(sentenceId),
		lemmas: await getLemmasInSentence(sentenceId)
	};
}) satisfies ServerLoad;
