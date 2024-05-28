import type { ServerLoad } from '@sveltejs/kit';
import { addSeenSentence } from '../../../../../db/sentencesSeen';

export const POST: ServerLoad = async ({ params, locals: { userId, language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	await addSeenSentence(sentenceId, userId!, language);

	return new Response(JSON.stringify({}), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
