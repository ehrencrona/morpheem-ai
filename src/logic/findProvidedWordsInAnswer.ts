import { filterUndefineds } from '$lib/filterUndefineds';
import { findProvidedWordsInAnswer as findProvidedWordsInAnswerAi } from '../ai/askMeAnything';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { getLemmaIdsOfWord } from '../db/lemmas';
import { getMnemonic } from '../db/mnemonics';
import * as DB from '../db/types';
import { getWordById, getWordByLemma } from '../db/words';
import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';
import { addWords } from './generateExampleSentences';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { translateWordInContext } from './translate';
import { Language } from './types';

export async function findProvidedWordsInAnswer({
	question,
	answer,
	userId,
	language
}: {
	question: string;
	answer: string;
	userId: number;
	language: Language;
}): Promise<UnknownWordResponse[]> {
	const provided = await findProvidedWordsInAnswerAi(question, answer, language);

	let unknownWords = await wordStringsToWords(provided, answer, language);

	console.log(
		`User was provided with the words ${unknownWords.map(({ word }) => word).join(', ')} in the answer "${answer}".`
	);

	unknownWords = await filterClearlyKnownWords(unknownWords, userId, language);

	return wordsToUnknownWords(unknownWords, userId, language);
}

export async function wordStringsToWords(
	wordStrings: string[],
	sentence: string,
	language: Language
) {
	return filterUndefineds(
		await Promise.all(
			wordStrings.map(async (wordString) => {
				let word: DB.Word;

				try {
					word = await getWordByLemma(wordString, language);
				} catch (e) {
					const lemmaIds = await getLemmaIdsOfWord(wordString, language);

					if (lemmaIds.length == 1) {
						word = await getWordById(lemmaIds[0].lemma_id, language);
					} else {
						console.error(
							`The word ${wordString} was provided in the answer "${sentence}" but does not exist. Adding it.`
						);

						word = (await addWords([wordString], language))[0];
					}
				}

				return { ...word, inflected: wordString };
			})
		)
	);
}

export async function filterClearlyKnownWords<W extends DB.Word>(
	unknownWords: W[],
	userId: number,
	language: Language
): Promise<W[]> {
	const knowledge = await getAggregateKnowledgeForUserWords({
		userId,
		wordIds: unknownWords.map(({ id }) => id),
		language
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
	words: (DB.Word & { inflected?: string })[],
	userId: number,
	language: Language
): Promise<UnknownWordResponse[]> {
	return Promise.all(
		words.map(async (word) => {
			const { english } = await translateWordInContext(word, { language, sentence: undefined });

			const mnemonic = await getMnemonic({ wordId: word.id, userId, language });

			return {
				...word,
				english,
				mnemonic
			};
		})
	);
}
