import { filterUndefineds } from '$lib/filterUndefineds';
import { pick } from '$lib/pick';
import { ServerLoad, redirect } from '@sveltejs/kit';
import {
	getMultipleWordsByIds,
	getNonCognateWordIds,
	getWordsOfSentence
} from '../../../../db/words';
import { getAggregateKnowledge } from '../../../../logic/getAggregateKnowledge';
import { getSentencesWithWord } from '../../../../logic/getSentencesWithWord';
import { getNextSentence } from '../../../../logic/isomorphic/getNext';

export const load: ServerLoad = async ({ url, request, locals: { language, userId } }) => {
	if (!userId) {
		return redirect(302, `/login`);
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

	const sentences = await Promise.all(
		words.map(
			async (word) =>
				getNextSentence(await getSentencesWithWord(word, language), knowledge, word.id)?.sentence
		)
	);

	const sentenceWords = await Promise.all(
		sentences.map(async (sentence) => sentence && getWordsOfSentence(sentence.id, language))
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
