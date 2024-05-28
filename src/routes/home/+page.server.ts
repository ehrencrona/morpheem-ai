import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getRecentKnowledge } from '../../db/knowledge';
import { getActivity } from '../../db/wordsKnown';
import { getRecentWrittenSentences } from '../../db/writtenSentences';

export const load = (async ({ locals }) => {
	const { language } = locals;

	if (!locals.user) {
		return redirect(302, '/login');
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
