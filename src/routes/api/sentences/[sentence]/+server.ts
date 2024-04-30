import type { ServerLoad } from '@sveltejs/kit';
import { addSeenSentence } from '../../../../db/sentencesSeen';
import { userId } from '../../../../logic/user';

export const POST: ServerLoad = async ({ params }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	await addSeenSentence(sentenceId, userId);

	return new Response(JSON.stringify({}), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
