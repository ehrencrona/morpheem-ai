import { getSentencesWithWord as getSentencesWithWordFromDd } from '../db/sentences';
import { getLastSeen } from '../db/sentencesSeen';
import type * as DB from '../db/types';
import { getWordsOfSentence } from '../db/words';

export async function getSentencesWithWord(word: DB.Word): Promise<
	(DB.Sentence & {
		words: DB.Word[];
		lastSeen: number | undefined;
	})[]
> {
	return addWordsToSentences(await getSentencesWithWordFromDd(word.id), word);
}

export async function addWordsToSentences(sentences: DB.Sentence[], word: DB.Word) {
	const lastSeen = await getLastSeen(sentences.map((sentence) => sentence.id));

	const words = await Promise.all(sentences.map((sentence) => getWordsOfSentence(sentence.id!)));

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
