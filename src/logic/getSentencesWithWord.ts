import { getSentence, getSentencesWithWord as getSentencesWithWordFromDd } from '../db/sentences';
import { getLastSeen } from '../db/sentencesSeen';
import type * as DB from '../db/types';
import { getWordsOfSentences } from '../db/words';
import { toWordStrings } from './toWordStrings';
import type { CandidateSentenceWithWords, Language } from './types';

export async function getSentencesWithWord(
	word: DB.Word,
	{
		language,
		userId,
		upToUnit
	}: {
		language: Language;
		userId?: number;
		upToUnit?: number;
	}
): Promise<CandidateSentenceWithWords[]> {
	const limit = 200;

	return addWordsToSentences(
		await getSentencesWithWordFromDd(word.id, {
			language,
			limit,
			upToUnit,
			userId,
			orderBy: 'level asc'
		}),
		word,
		language
	);
}

export async function getCandidateSentence(
	sentenceId: number,
	language: Language
): Promise<CandidateSentenceWithWords> {
	const sentences = await addWordsToSentences(
		[await getSentence(sentenceId, language)],
		null,
		language
	);

	if (sentences.length === 0) {
		throw new Error(`Sentence ${sentenceId} not retrievable`);
	}

	return sentences[0];
}

export async function addWordsToSentences(
	sentences: DB.Sentence[],
	word: DB.Word | null,
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
			let hasStudiedWord = true;

			if (word) {
				hasStudiedWord = sentence.words.some(({ id }) => id === word.id);

				if (!hasStudiedWord) {
					console.warn(
						`Word ${word.word} not found in sentence ${sentence.id}, only ${sentence.words.map(({ word }) => word).join(', ')}`
					);
				}
			}

			const wordCountCorrect =
				sentence.words.length == toWordStrings(sentence.sentence, language).length;

			if (!wordCountCorrect) {
				console.warn(
					`Sentence ${sentence.id} (${language.code}) has ${toWordStrings(sentence.sentence, language).length} actual words, but has ${sentence.words.length} words in the DB`
				);
			}

			return hasStudiedWord && wordCountCorrect;
		});

	return result;
}
