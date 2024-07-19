import { filterUndefineds } from '$lib/filterUndefineds';
import { findProvidedWordsInAnswer as findProvidedWordsInAnswerAi } from '../ai/askMeAnything';
import { getLemmaIdsOfWord } from '../db/lemmas';
import { getMnemonic } from '../db/mnemonics';
import * as DB from '../db/types';
import { getWordById, getWordByLemma } from '../db/words';
import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';
import { addWords } from './generateExampleSentences';
import { translateWordInContext, translateWordOutOfContext } from './translate';
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
		`User was provided with ${unknownWords.length ? `the words ${unknownWords.map(({ word }) => word).join(', ')}` : 'no words'} in the answer "${answer}".`
	);

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

					if (lemmaIds.length >= 1) {
						if (lemmaIds.length > 1) {
							console.warn(
								`The word ${wordString} was provided in the answer "${sentence}" has multiple lemmas. Using the first one.`
							);
						}
						word = await getWordById(lemmaIds[0].lemma_id, language);
					} else {
						console.error(
							`The word ${wordString} was provided in the answer "${sentence}" but does not exist. Adding it.`
						);

						word = (await addWords([wordString], language))[0];

						if (!word) {
							return;
						}
					}
				}

				return { ...word, inflected: wordString };
			})
		)
	);
}

export function wordsToUnknownWords(
	words: (DB.Word & { inflected?: string })[],
	userId: number,
	language: Language
): Promise<UnknownWordResponse[]> {
	return Promise.all(
		words.map(async (word) => {
			const { english } = await translateWordOutOfContext(word.word, {
				word,
				language
			});

			const mnemonic = await getMnemonic({ wordId: word.id, userId, language });

			return {
				...word,
				english,
				mnemonic
			};
		})
	);
}
