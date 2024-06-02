import { filterUndefineds } from '$lib/filterUndefineds';
import { pick } from '$lib/pick';
import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad } from '@sveltejs/kit';
import {
	getMultipleWordsByIds,
	getNonCognateWordIds,
	getWordsOfSentence,
	getWordsOfSentences
} from '../../../../db/words';
import { getAggregateKnowledge } from '../../../../logic/getAggregateKnowledge';
import { getSentencesWithWord } from '../../../../logic/getSentencesWithWord';
import { getNextSentence } from '../../../../logic/isomorphic/getNext';

export const load: ServerLoad = async ({ url, locals: { language, userId } }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const level = parseInt(url.searchParams.get('level') || '99') || 99;

	const ids = await getNonCognateWordIds(language, Math.max(level, 10));

	const words = await getMultipleWordsByIds(
		pick(
			ids.map(({ id }) => id),
			20
		),
		language
	);

	const knowledge = await getAggregateKnowledge(userId, language);

	const sentences = filterUndefineds(
		await Promise.all(
			words.map(
				async (word) =>
					getNextSentence(await getSentencesWithWord(word, language), knowledge, word.id)?.sentence
			)
		)
	);

	const sentenceWords = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	return {
		words: filterUndefineds(
			sentences.map((sentence, i) =>
				sentence && words[i] && sentenceWords[i]
					? {
							sentence: sentence,
							word: words[i],
							sentenceWords: sentenceWords[i]!
						}
					: undefined
			)
		),
		languageCode: language.code
	};
};
