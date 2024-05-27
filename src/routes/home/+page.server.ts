import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getRecentKnowledge } from '../../db/knowledge';
import { getActivity } from '../../db/wordsKnown';
import { getRecentWrittenSentences } from '../../db/writtenSentences';

export const load = (async ({ locals }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	const userId = locals.user.num;

	return {
		knowledge: await getRecentKnowledge({
			userId
		}),
		writtenSentences: await getRecentWrittenSentences({ userId }),
		activity: await getActivity(userId)
	};
}) satisfies ServerLoad;
