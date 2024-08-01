import { filterUndefineds } from '$lib/filterUndefineds';
import { CodedError } from '../CodedError';
import { lemmatizeSentences } from '../ai/lemmatize';
import * as DB from '../db/types';
import { deleteWord } from '../db/words';
import { addSentences } from './addSentence';
import {
	generateExampleSentences,
	generatePersonalizedExampleSentences
} from './generateExampleSentences';
import { addWordsToSentences, getSentencesWithWord } from './getSentencesWithWord';
import { Language } from './types';
import { unzip, zip } from '$lib/zip';

/** Makes up new sentences for the specified word */
export async function addSentencesForWord(
	word: DB.Word,
	{
		userId,
		language,
		level,
		retriesLeft = 1
	}: { userId?: number; language: Language; retriesLeft?: number; level?: number }
): ReturnType<typeof getSentencesWithWord> {
	async function getSentences() {
		return userId
			? (
					await generatePersonalizedExampleSentences(word.word, {
						level: level || word.level,
						userId,
						language
					})
				).map(({ sentence }) => sentence)
			: await generateExampleSentences(word.word, {
					language,
					level: (level || word.level) < 99 ? level || word.level : undefined
				});
	}

	let sentences = await getSentences();
	let lemmas = await lemmatizeSentences(sentences, { language, onError: 'returnempty' });

	[sentences, lemmas] = unzip(
		zip(sentences, lemmas).filter(([sentence, lemmas]) => lemmas.length > 0)
	);

	const result = filterUndefineds(
		(await addSentences(sentences, undefined, lemmas, { language })).filter((sentence) => {
			const hasWord = sentence.words.some((sentenceWord) => sentenceWord.word === word.word);

			if (!hasWord) {
				console.warn(
					`Word ${word.word} not found in sentence ${sentence.sentence}, only ${sentence.words.map(({ word }) => word).join(', ')}`
				);
			}

			return hasWord;
		})
	);

	if (result.length == 0) {
		const [[lemma]] = await lemmatizeSentences([word.word], { language });

		if (lemma != word.word) {
			const existingSentences = await getSentencesWithWord(word, { language, userId });

			const message = `No valid example sentences found for ${word.word} (${word.id}), probably because the lemma is actually ${lemma}.`;

			if (existingSentences.length < 3) {
				await deleteWord(word.id, language);

				throw new CodedError(`${message} Deleting the word`, 'wrongLemma');
			} else {
				throw new CodedError(message, 'wrongLemma');
			}
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
