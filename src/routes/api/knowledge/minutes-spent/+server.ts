import { json, type ServerLoad } from '@sveltejs/kit';
import { storeMinuteSpent } from '../../../../db/wordsKnown';

export const POST: ServerLoad = async ({ request, locals }) => {
	const userId = locals.user!.num;

	await storeMinuteSpent(userId);

	return json({});
};
