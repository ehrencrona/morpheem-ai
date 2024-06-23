import { filterUndefineds } from '$lib/filterUndefineds';
import { pick } from '$lib/pick';
import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad } from '@sveltejs/kit';
import {
	getMultipleWordsByIds,
	getWordIdsForCloze,
	getWordsOfSentences
} from '../../../../db/words';
import { getAggregateKnowledge } from '../../../../logic/getAggregateKnowledge';
import { getSentencesWithWord } from '../../../../logic/getSentencesWithWord';
import { getNextSentence } from '../../../../logic/isomorphic/getNext';
import { Language } from '../../../../logic/types';
import { logError } from '$lib/logError';

export const load: ServerLoad = async ({ url, locals: { language, userId } }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const level = parseInt(url.searchParams.get('level') || '99') || 99;

	const knowledge = await getAggregateKnowledge(userId, language);

	const sentences = filterUndefineds(
		await Promise.all(
			(await getWordsForTest(level, language)).map(async (word) => {
				const sentence = getNextSentence(
					await getSentencesWithWord(word, language),
					knowledge,
					word.id,
					'read'
				)?.sentence;

				if (sentence) {
					return { sentence, word };
				} else {
					console.warn(`Got no sentence for word ${word.id}`);
				}
			})
		)
	);

	const sentenceWords = await getWordsOfSentences(
		sentences.map(({ sentence }) => sentence.id),
		language
	);

	return {
		words: filterUndefineds(
			sentences.map(({ sentence, word }, i) => {
				if (sentenceWords[i]?.length) {
					return {
						sentence,
						word,
						sentenceWords: sentenceWords[i]!
					};
				} else {
					logError(`Got no sentence words for sentence ${sentence.id}`);
				}
			})
		),
		languageCode: language.code
	};
};

async function getWordsForTest(level: number, language: Language) {
	const ids = await getWordIdsForCloze(language, Math.max(level, 10));

	return getMultipleWordsByIds(
		pick(
			ids.map(({ id }) => id),
			20
		),
		language
	);
}
