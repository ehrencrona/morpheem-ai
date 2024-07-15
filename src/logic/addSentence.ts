import { addWordToLemma, getLemmasOfWords } from '../db/lemmas';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { toWordStrings } from './toWordStrings';

import { filterUndefineds } from '$lib/filterUndefineds';
import { unzip, zip } from '$lib/zip';
import { CodedError } from '../CodedError';
import { classifyLemmas } from '../ai/classifyLemmas';
import * as dbSentences from '../db/sentences';
import { WordType } from '../db/types';
import { getLevelForCognate } from './isomorphic/getNext';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';

/**
 * Some sentences might fail to save, in which case they won't be returned.
 */
export async function addSentences(
	sentences: string[],
	english: string[] | undefined,
	lemmas: string[][],
	{
		userId,
		language
	}: {
		language: Language;
		userId?: number;
	}
) {
	console.log(
		`Adding sentences ${sentences.map((s) => `"${s}"`).join(',')} ${userId ? ` by user ${userId}` : ''}...`
	);

	const words = await getSentencesWords(sentences, lemmas, { language, throwOnError: false });

	return filterUndefineds(
		await Promise.all(
			sentences.map(async (sentenceString, i) => {
				if (words[i].length) {
					return dbSentences.addSentence(sentenceString, {
						english: english?.[i],
						words: words[i],
						language,
						userId,
						level: calculateSentenceLevel(words[i])
					});
				}
			})
		)
	);
}

/**
 * Will throw if there are any issues with the sentence.
 */
export async function addSentence(
	sentenceString: string,
	opts: {
		english: string | undefined;
		lemmas: string[];
		language: Language;
		userId?: number;
	}
) {
	let { english, lemmas, language, userId } = opts;

	console.log(
		`Adding sentence "${sentenceString}" (lemmas: ${lemmas.join(' ')})${userId ? ` by user ${userId}` : ''}...`
	);

	const words = await getSentenceWords(sentenceString, { lemmas, language, throwOnError: true });

	return dbSentences.addSentence(sentenceString, {
		english,
		words,
		language,
		userId,
		level: calculateSentenceLevel(words)
	});
}

export function calculateSentenceLevel(words: { level: number; type: WordType | undefined }[]) {
	return Math.round(
		words.reduce(
			(acc, { level, type }) =>
				acc * ((type == 'cognate' || type == 'name' ? getLevelForCognate(level) : level) + 1),
			1
		) **
			(1 / words.length)
	);
}

export async function getSentenceWords(
	sentenceString: string,
	{
		lemmas,
		language,
		throwOnError = true
	}: {
		lemmas?: string[];
		language: Language;
		throwOnError: boolean;
	}
) {
	return (
		await getSentencesWords([sentenceString], lemmas ? [lemmas] : undefined, {
			language,
			throwOnError
		})
	)[0];
}

/**
 * If throwOnError=false and an error is encountered, returns zero words for that sentence.
 */
export async function getSentencesWords(
	sentences: string[],
	lms: string[][] | undefined,
	{
		language,
		throwOnError = true
	}: {
		language: Language;
		throwOnError: boolean;
	}
) {
	const handleError = (message: string) => {
		message = `Error getting sentence words: ${message}`;

		if (throwOnError) {
			throw new Error(message);
		} else {
			console.warn(message);
		}
	};

	let lemmas = lms || (await lemmatizeSentences(sentences, { language }));

	const wordStrings = sentences.map((sentenceString) => toWordStrings(sentenceString, language));

	let words = await getMultipleWordsByLemmas(lemmas.flat(), language);

	let missingWords = lemmas.flat().filter((lemma) => !words.some((word) => word.word == lemma));

	const allLemmas = await getLemmasOfWords(missingWords, language);

	missingWords.forEach((missingWord, i) => {
		const wordLemmas = allLemmas[i];

		if (wordLemmas.length > 0) {
			const rightLemma = wordLemmas[0];

			console.error(
				`Wanted to add ${missingWord} as a new word, but it is probably a not a lemma; rather ${wordLemmas.map(({ word }) => word).join(' / ')} is, so using ${wordLemmas[0].word} instead.`
			);

			words.push(rightLemma);

			lemmas = lemmas.map((lemmas) =>
				lemmas.map((lemma) => (lemma === missingWord ? rightLemma.word! : lemma))
			);
		}
	});

	missingWords = lemmas.flat().filter((lemma) => !words.some((word) => word.word == lemma));

	if (missingWords.length) {
		let lemmaTypes = await classifyLemmas(missingWords, { language, throwOnInvalid: false });

		words.push(
			...filterUndefineds(
				await Promise.all(
					zip(lemmaTypes, missingWords)
						.filter(([{ type }, word]) => {
							if (['inflection', 'wrong'].includes(type || '')) {
								handleError(`Skipping word ${word} because it is an inflection or wrong`);

								lemmas = lemmas.map((lemmas) => (lemmas.includes(word) ? [] : lemmas));

								return false;
							}

							return true;
						})
						.map(async ([_, lemma]) => {
							try {
								return (await addWord(lemma, {
									language,
									type: (lemmaTypes.find(({ lemma: l }) => l === lemma)?.type as WordType) || null
								}))!;
							} catch (e) {
								if (e instanceof CodedError && e.code === 'notALemma') {
									handleError(`Skipping word ${lemma} because it is not a lemma`);

									lemmas = lemmas.map((lemmas) => (lemmas.includes(lemma) ? [] : lemmas));
								} else {
									throw e;
								}
							}
						})
				)
			)
		);
	}

	await Promise.all(
		zip(lemmas, wordStrings).map(([lemmas, wordStrings]) => {
			if (lemmas.length > 0) {
				zip(lemmas, wordStrings).map(([lemma, wordString]) =>
					addWordToLemma(wordString, words.find((word) => word.word === lemma)!, language)
				);
			}
		})
	);

	return lemmas.map((lemmas) =>
		lemmas.map((lemma, index) => {
			const word = words.find((w) => w.word === lemma);

			if (!word) {
				throw new Error(`Word ${lemma} not found in words`);
			}

			return {
				...word,
				word_index: index
			};
		})
	);
}
