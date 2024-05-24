import { json, type ServerLoad } from '@sveltejs/kit';
import { storeMinuteSpent } from '../../../../db/wordsKnown';
import { userId } from '../../../../logic/user';

export const POST: ServerLoad = async ({ request }) => {
	await storeMinuteSpent(userId);

	return json({});
};
