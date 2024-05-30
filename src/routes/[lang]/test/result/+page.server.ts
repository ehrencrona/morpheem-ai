import { ServerLoad, redirect } from '@sveltejs/kit';
import { getAggregateKnowledgeForUser } from '../../../../db/knowledge';
import { calculateWordsKnown } from '../../../../logic/isomorphic/wordsKnown';
import { getWordCount } from '../../../../db/words';

export const load: ServerLoad = async ({ locals: { userId, language } }) => {
	if (!userId) {
		return redirect(302, `/login`);
	}

	const knowledge = await getAggregateKnowledgeForUser({ userId, language });

	const wordsKnown = calculateWordsKnown(knowledge);

	const wordCount = await getWordCount(language);

	return {
		wordsKnown,
		languageCode: language.code,
		wordCount
	};
};
