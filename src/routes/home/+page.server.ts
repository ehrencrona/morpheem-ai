import type { ServerLoad } from '@sveltejs/kit';
import { getRecentKnowledge } from '../../db/knowledge';
import { getRecentWrittenSentences } from '../../db/writtenSentences';
import { userId } from '../../logic/user';
import { getActivity } from '../../db/wordsKnown';

export const load = (async ({}) => {
	return {
		knowledge: await getRecentKnowledge({
			userId
		}),
		writtenSentences: await getRecentWrittenSentences({ userId }),
		activity: await getActivity(userId)
	};
}) satisfies ServerLoad;
