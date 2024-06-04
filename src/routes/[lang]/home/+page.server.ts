import { redirectToLogin } from '$lib/redirectToLogin';
import { type ServerLoad } from '@sveltejs/kit';
import { getRecentKnowledge } from '../../../db/knowledge';
import { getActivity } from '../../../db/wordsKnown';
import { getRecentWrittenSentences } from '../../../db/writtenSentences';

export const load = (async ({ locals, url }) => {
	const { language } = locals;

	if (!locals.user) {
		return redirectToLogin(url);
	}

	const userId = locals.user.num;

	return {
		knowledge: await getRecentKnowledge({
			userId,
			language
		}),
		writtenSentences: await getRecentWrittenSentences({ userId, language }),
		activity: await getActivity(userId, language)
	};
}) satisfies ServerLoad;
