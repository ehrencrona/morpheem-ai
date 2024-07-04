import { filterUndefineds } from '$lib/filterUndefineds';
import { CodedError } from '../CodedError';
import { lemmatizeSentences } from '../ai/lemmatize';
import * as DB from '../db/types';
import { deleteWord } from '../db/words';
import { addSentence } from './addSentence';
import { addWordsToSentences, getSentencesWithWord } from './getSentencesWithWord';
import {
	generateExampleSentences,
	generatePersonalizedExampleSentences
} from './generateExampleSentences';
import { Language } from './types';
import { logError } from '$lib/logError';

/** Makes up new sentences for the specified word */
export async function addSentencesForWord(
	word: DB.Word,
	{
		userId,
		language,
		retriesLeft = 1
	}: { userId?: number; language: Language; retriesLeft?: number }
): ReturnType<typeof getSentencesWithWord> {
	async function getSentences(retriesLeft = 1) {
		try {
			return userId
				? (
						await generatePersonalizedExampleSentences(word.word, {
							level: word.level,
							userId,
							language
						})
					).map(({ sentence }) => sentence)
				: await generateExampleSentences(word.word, {
						language,
						level: word.level < 99 ? word.level : undefined
					});
		} catch (e: any) {
			if (e.code == 'noLemmaFound' && retriesLeft > 0) {
				// most likely, the sentence contained a word that doesn't actually exist
				logError(e);

				return getSentences(retriesLeft - 1);
			}
			throw e;
		}
	}

	const sentences = await getSentences();
	const lemmas = await lemmatizeSentences(sentences, { language });

	const result = filterUndefineds(
		(
			await Promise.all(
				sentences.map(async (sentence, i) =>
					addSentence(sentence, { english: undefined, lemmas: lemmas[i], language })
				)
			)
		).filter((sentence) => {
			const hasWord = sentence.words.some((sentenceWord) => sentenceWord.word === word.word);

			if (!hasWord) {
				console.warn(
					`Word ${word.word} not found in sentence ${sentence}, only ${sentence.words.map(({ word }) => word).join(', ')}`
				);
			}

			return hasWord;
		})
	);

	if (result.length == 0) {
		const [[lemma]] = await lemmatizeSentences([word.word], { language });

		if (lemma != word.word) {
			await deleteWord(word.id, language);

			throw new CodedError(
				`No valid example sentences found for ${word.word} (${word.id}), probably because the lemma is actually ${lemma}. Deleting the word`,
				'wrongLemma'
			);
		}

		const message = `No valid example sentences found for ${word.word} (${word.id})`;

		if (retriesLeft > 0) {
			console.error(message + ', retrying...');

			return addSentencesForWord(word, { retriesLeft: retriesLeft - 1, userId, language });
		} else {
			throw new CodedError(message, 'noValidSentencesFound');
		}
	}

	return addWordsToSentences(result, word, language);
}
