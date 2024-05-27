import { filterUndefineds } from '$lib/filterUndefineds';
import { findProvidedWordsInAnswer as findProvidedWordsInAnswerAi } from '../ai/askMeAnything';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { getLemmaIdsOfWord } from '../db/lemmas';
import { getMnemonic } from '../db/mnemonics';
import * as DB from '../db/types';
import { getWordById, getWordByLemma } from '../db/words';
import { UnknownWordResponse } from '../routes/api/word/unknown/+server';
import { addWords } from './generateExampleSentences';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { translateWordInContext } from './translate';

export async function findProvidedWordsInAnswer({
	question,
	answer,
	userId
}: {
	question: string;
	answer: string;
	userId: number;
}): Promise<UnknownWordResponse[]> {
	const provided = await findProvidedWordsInAnswerAi(question, answer);

	let unknownWords = await wordStringsToWords(provided, answer);

	console.log(
		`User was provided with the words ${unknownWords.map(({ word }) => word).join(', ')} in the answer "${answer}".`
	);

	unknownWords = await filterClearlyKnownWords(unknownWords, userId);

	return wordsToUnknownWords(unknownWords, userId);
}

export async function wordStringsToWords(wordStrings: string[], sentence: string) {
	return filterUndefineds(
		await Promise.all(
			wordStrings.map(async (wordString) => {
				try {
					return await getWordByLemma(wordString);
				} catch (e) {
					const lemmaIds = await getLemmaIdsOfWord(wordString);

					if (lemmaIds.length == 1) {
						return getWordById(lemmaIds[0].lemma_id);
					} else {
						console.error(
							`The word ${wordString} was provided in the answer "${sentence}" but does not exist. Adding it.`
						);

						return (await addWords([wordString]))[0];
					}
				}
			})
		)
	);
}

export async function filterClearlyKnownWords(
	unknownWords: DB.Word[],
	userId: number
): Promise<DB.Word[]> {
	const knowledge = await getAggregateKnowledgeForUserWords({
		userId,
		wordIds: unknownWords.map(({ id }) => id)
	});

	return unknownWords.filter((word) => {
		const k = knowledge.find(({ wordId }) => wordId === word.id);
		const knew = k && expectedKnowledge(k, { now: now(), exercise: 'write' }) > 0.8;

		if (knew) {
			console.log(`User already knew the word ${word.word}.`);
		}

		return !knew;
	});
}

export function wordsToUnknownWords(
	words: DB.Word[],
	userId: number
): Promise<UnknownWordResponse[]> {
	return Promise.all(
		words.map(async (word) => {
			const { english } = await translateWordInContext(word);

			const mnemonic = await getMnemonic({ wordId: word.id, userId });

			return {
				...word,
				english,
				mnemonic
			};
		})
	);
}
