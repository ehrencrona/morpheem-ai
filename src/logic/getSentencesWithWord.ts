import { getSentencesWithWord as getSentencesWithWordFromDd } from '../db/sentences';
import { getLastSeen } from '../db/sentencesSeen';
import type * as DB from '../db/types';
import { getWordsOfSentence } from '../db/words';
import type { CandidateSentenceWithWords, Language } from './types';

export async function getSentencesWithWord(
	word: DB.Word,
	language: Language
): Promise<CandidateSentenceWithWords[]> {
	return addWordsToSentences(await getSentencesWithWordFromDd(word.id, language), word, language);
}

export async function addWordsToSentences(
	sentences: DB.Sentence[],
	word: DB.Word,
	language: Language
): Promise<CandidateSentenceWithWords[]> {
	const lastSeen = await getLastSeen(
		sentences.map((sentence) => sentence.id),
		language
	);

	const words = await Promise.all(
		sentences.map((sentence) => getWordsOfSentence(sentence.id!, language))
	);

	const result = sentences
		.map((sentence, i) => ({
			...sentence,
			words: words[i],
			lastSeen: lastSeen[i]
		}))
		.filter((sentence) => {
			const hasStudiedWord = sentence.words.some(({ id }) => id === word.id);

			if (!hasStudiedWord) {
				console.warn(
					`Word ${word.word} not found in sentence ${sentence.id}, only ${sentence.words.map(({ word }) => word).join(', ')}`
				);
			}

			return hasStudiedWord;
		});

	return result;
}
