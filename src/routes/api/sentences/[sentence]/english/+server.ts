import { json, type ServerLoad } from '@sveltejs/kit';
import { getSentence } from '../../../../../db/sentences';
import { generateHint } from '../../../../../ai/generateHint';
import { addEnglishToSentence } from '../../../../../logic/translate';

export const GET: ServerLoad = async ({ params }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	const sentence = await addEnglishToSentence(await getSentence(sentenceId));

	return json(sentence.english);
};
