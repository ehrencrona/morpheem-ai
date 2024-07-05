import { addWordToLemma, getLemmasOfWords } from '../db/lemmas';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { toWordStrings } from './toWordStrings';

import { classifyLemmas } from '../ai/classifyLemmas';
import * as sentences from '../db/sentences';
import { WordType } from '../db/types';
import { getLevelForCognate } from './isomorphic/getNext';
import { Language } from './types';
import { CodedError } from '../CodedError';
import { lemmatizeSentences } from './lemmatize';

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

	const words = await getSentenceWords(sentenceString, { lemmas, language });

	return sentences.addSentence(sentenceString, {
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
	opts: {
		lemmas?: string[];
		language: Language;
		retriesLeft?: number;
	}
) {
	let { lemmas: ls, language, retriesLeft = 1 } = opts;

	let lemmas = ls || (await lemmatizeSentences([sentenceString], { language }))[0];

	const wordStrings = toWordStrings(sentenceString, language);

	if (wordStrings.length !== lemmas.length) {
		throw new Error(
			`Number of words does not match number of lemmas:\n${sentenceString}\n${lemmas.join(' ')}`
		);
	}

	if (wordStrings.length === 0) {
		return [];
	}

	let words = await getMultipleWordsByLemmas(lemmas, language);

	let missingWords = lemmas.filter((lemma) => !words.some((word) => word.word == lemma));

	const allLemmas = await getLemmasOfWords(missingWords, language);

	missingWords.forEach((missingWord, i) => {
		const wordLemmas = allLemmas[i];

		if (wordLemmas.length > 0) {
			const rightLemma = wordLemmas[0];

			console.warn(
				`Wanted to add ${missingWord} as a new word, but it is probably a not a lemma; rather ${wordLemmas.map(({ word }) => word).join(' / ')} is, so using that instead.`
			);

			words.push(rightLemma);

			lemmas = lemmas.map((lemma) => (lemma === missingWord ? rightLemma.word! : lemma));
		}
	});

	missingWords = lemmas.filter((lemma) => !words.some((word) => word.word == lemma));

	if (missingWords.length) {
		try {
			const lemmaTypes = await classifyLemmas(missingWords, { language, throwOnInvalid: true });

			words.push(
				...(await Promise.all(
					missingWords.map(
						async (lemma) =>
							(await addWord(lemma, {
								language,
								type: (lemmaTypes.find(({ lemma: l }) => l === lemma)?.type as WordType) || null
							}))!
					)
				))
			);
		} catch (e) {
			if ((e as CodedError).code == 'notALemma' && retriesLeft > 0) {
				console.warn(
					`Got not a lemma when dealing with sentence words of "${sentenceString}" (words: ${words.map(({ word }) => word).join(', ')}): ${(e as CodedError).message}. Retrying...`
				);

				lemmas = (
					await lemmatizeSentences([sentenceString], {
						language,
						ignoreErrors: false,
						temperature: 0.8
					})
				)[0];

				return getSentenceWords(sentenceString, {
					...opts,
					lemmas,
					retriesLeft: retriesLeft - 1
				});
			} else {
				throw e;
			}
		}
	}

	await Promise.all(
		lemmas
			.map((lemma, i) => [lemma, wordStrings[i]])
			.map(([lemma, wordString]) =>
				addWordToLemma(wordString, words.find((word) => word.word === lemma)!, language)
			)
	);

	return lemmas.map((lemma, index) => {
		const word = words.find((w) => w.word === lemma);

		if (!word) {
			throw new Error(`Word ${lemma} not found in words`);
		}

		return {
			...word,
			word_index: index
		};
	});
}
