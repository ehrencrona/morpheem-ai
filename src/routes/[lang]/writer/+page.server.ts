import { redirectToLogin } from '$lib/redirectToLogin';
import { getRecentWrittenSentences } from '../../../db/writtenSentences';

export const load = async ({ locals: { userId, language }, url }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	return { sentences: await getRecentWrittenSentences({ userId, language }) };
};
