import { json, type ServerLoad } from '@sveltejs/kit';
import { storeMinuteSpent } from '../../../../db/wordsKnown';

export const POST: ServerLoad = async ({ locals: { userId, language } }) => {
	await storeMinuteSpent(userId!, language);

	return json({});
};
