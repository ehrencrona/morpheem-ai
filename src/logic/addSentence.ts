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
import { dedup } from '$lib/dedup';

/**
 * Some sentences might fail to save, in which case they won't be returned.
 */
export async function addSentences(
	sentences: string[],
	english: string[] | undefined,
	lemmas: string[][],
	{
		userId,
		language,
		unit
	}: {
		language: Language;
		userId?: number;
		unit?: number;
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
						level: calculateSentenceLevel(words[i]),
						unit
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
		unit?: number;
	}
) {
	let { english, lemmas, language, userId, unit } = opts;

	const words = await getSentenceWords(sentenceString, { lemmas, language, throwOnError: true });

	const sentence = await dbSentences.addSentence(sentenceString, {
		english,
		words,
		language,
		userId,
		level: calculateSentenceLevel(words),
		unit
	});

	console.log(
		`Adding sentence "${sentenceString}" (ID: ${sentence.id}, lemmas: ${lemmas.join(' ')}${userId ? `, user: ${userId}` : ''})...`
	);

	return sentence;
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

	let lemmas =
		lms ||
		(await lemmatizeSentences(sentences, {
			language,
			// would be better if we could use returnempty
			onError: throwOnError ? 'throw' : 'useword'
		}));

	const wordStrings = sentences.map((sentenceString) => toWordStrings(sentenceString, language));

	let words = await getMultipleWordsByLemmas(lemmas.flat(), language);

	let missingWords = lemmas.flat().filter((lemma) => !words.some((word) => word.word == lemma));

	const allLemmas = await getLemmasOfWords(missingWords, language);

	missingWords.forEach((missingWord, i) => {
		const wordLemmas = allLemmas[i];

		// in Swedish the lemmatization is reliable enough (and there are enough homonyms) that this just causes false postives
		// maybe also the case for other languages with claude?
		if (wordLemmas.length > 0 && language.code != 'sv') {
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

	missingWords = dedup(lemmas.flat().filter((lemma) => !words.some((word) => word.word == lemma)));

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
