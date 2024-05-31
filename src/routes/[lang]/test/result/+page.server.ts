import { ServerLoad, redirect } from '@sveltejs/kit';
import { getAggregateKnowledgeForUser } from '../../../../db/knowledge';
import { calculateWordsKnown } from '../../../../logic/isomorphic/wordsKnown';
import { getWordCount } from '../../../../db/words';
import { redirectToLogin } from '$lib/redirectToLogin';

export const load: ServerLoad = async ({ locals: { userId, language }, url }) => {
	if (!userId) {
		return redirectToLogin(url);
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
