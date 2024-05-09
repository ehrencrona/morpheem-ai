import { filterUndefineds } from '$lib/filterUndefineds';
import { CodedError } from '../CodedError';
import { lemmatizeSentences } from '../ai/lemmatize';
import * as DB from '../db/types';
import { deleteWord } from '../db/words';
import { addSentence } from './addSentence';
import { addWordsToSentences, getSentencesWithWord } from './getSentencesWithWord';
import { inventExampleSentences } from './inventExampleSentences';

export async function addSentencesForWord(
	word: DB.Word,
	{ count = 5, retriesLeft = 1 }: { count?: number; retriesLeft?: number } = {}
): ReturnType<typeof getSentencesWithWord> {
	if (count < 1) {
		throw new Error('count must be at least 1');
	}

	async function getSentences(retriesLeft = 1) {
		try {
			const sentences = await inventExampleSentences(word.word, word.level, count);

			return sentences;
		} catch (e: any) {
			if (e.code == 'noLemmaFound' && retriesLeft > 0) {
				// most likely, the sentence contained a word that doesn't actually exist
				console.error(e.message);

				return getSentences(retriesLeft - 1);
			}
			throw e;
		}
	}

	const result = filterUndefineds(
		await Promise.all(
			(await getSentences())
				.filter(({ sentence, lemmatized }) => {
					const hasWord = lemmatized.some((lemma) => lemma === word.word);

					if (!hasWord) {
						console.warn(
							`Word ${word.word} not found in sentence ${sentence}, only ${lemmatized.join(', ')}`
						);
					}

					return hasWord;
				})
				.map(async ({ sentence, english, lemmatized }) =>
					addSentence(sentence, english, lemmatized)
				)
		)
	);

	if (result.length == 0) {
		const [[lemma]] = await lemmatizeSentences([word.word]);

		if (lemma != word.word) {
			await deleteWord(word.id);

			throw new CodedError(
				`No valid example sentences found for ${word.word} (${word.id}), probably because the lemma is actually ${lemma}. Deleting the word`,
				'wrongLemma'
			);
		}

		const message = `No valid example sentences found for ${word.word} (${word.id})`;

		if (retriesLeft > 0) {
			console.error(message + ', retrying...');

			return addSentencesForWord(word, { count, retriesLeft: retriesLeft - 1 });
		} else {
			throw new CodedError(message, 'noValidSentencesFound');
		}
	}

	return addWordsToSentences(result, word);
}
