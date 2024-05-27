import type { ServerLoad } from '@sveltejs/kit';
import { addSeenSentence } from '../../../../db/sentencesSeen';

export const POST: ServerLoad = async ({ params, locals }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	const userId = locals.user!.num;

	await addSeenSentence(sentenceId, userId);

	return new Response(JSON.stringify({}), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
