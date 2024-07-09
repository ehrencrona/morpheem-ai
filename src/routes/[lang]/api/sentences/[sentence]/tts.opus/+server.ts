import { type ServerLoad } from '@sveltejs/kit';
import { tts } from '../../../../../../ai/tts';
import { getSentence } from '../../../../../../db/sentences';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	const sentence = await getSentence(sentenceId, language);

	const speech = await tts(sentence.sentence);

	const buffer = await speech.arrayBuffer();

	return new Response(buffer, {
		headers: {
			'Content-Type': 'audio/opus',
			'cache-control': 'public, max-age=31536000, immutable'
		}
	});
};
