import { json, type ServerLoad } from '@sveltejs/kit';
import { getSentence } from '../../../../../db/sentences';
import { generateHint } from '../../../../../ai/generateHint';

export const GET: ServerLoad = async ({ params }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	const sentence = await getSentence(sentenceId);

	const hint = await generateHint(sentence.english!);

	return json(hint);
};
