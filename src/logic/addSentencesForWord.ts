import { filterUndefineds } from '$lib/filterUndefineds';
import { CodedError } from '../CodedError';
import { lemmatizeSentences } from '../ai/lemmatize';
import * as DB from '../db/types';
import { deleteWord } from '../db/words';
import { addSentence } from './addSentence';
import { addWordsToSentences, getSentencesWithWord } from './getSentencesWithWord';
import { generateExampleSentences } from './generateExampleSentences';

/** Makes up new sentences for the specified word */
export async function addSentencesForWord(
	word: DB.Word,
	{ retriesLeft = 1 }: { retriesLeft?: number } = {}
): ReturnType<typeof getSentencesWithWord> {
	async function getSentences(retriesLeft = 1) {
		try {
			const sentences = await generateExampleSentences(word.word, word.level);

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
				.filter(({ sentence, lemmas }) => {
					const hasWord = lemmas.some((lemma) => lemma === word.word);

					if (!hasWord) {
						console.warn(
							`Word ${word.word} not found in sentence ${sentence}, only ${lemmas.join(', ')}`
						);
					}

					return hasWord;
				})
				.map(async ({ sentence, english, lemmas }) => addSentence(sentence, english, lemmas))
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

			return addSentencesForWord(word, { retriesLeft: retriesLeft - 1 });
		} else {
			throw new CodedError(message, 'noValidSentencesFound');
		}
	}

	return addWordsToSentences(result, word);
}
