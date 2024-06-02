import { getSentencesWithWord as getSentencesWithWordFromDd } from '../db/sentences';
import { getLastSeen } from '../db/sentencesSeen';
import type * as DB from '../db/types';
import { getWordsOfSentence, getWordsOfSentences } from '../db/words';
import { toWords } from './toWords';
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
	if (sentences.length === 0) {
		return [];
	}

	const lastSeen = await getLastSeen(
		sentences.map((sentence) => sentence.id),
		language
	);

	const words = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
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

			const wordCountCorrect = sentence.words.length == toWords(sentence.sentence, language).length;

			if (!wordCountCorrect) {
				console.warn(
					`Sentence ${sentence.id} (${language.code}) has ${toWords(sentence.sentence, language).length} actual words, but has ${sentence.words.length} words in the DB`
				);
			}

			return hasStudiedWord && wordCountCorrect;
		});

	return result;
}
