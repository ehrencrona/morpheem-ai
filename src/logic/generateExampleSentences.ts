import { dedup } from '$lib/dedup';
import { filterUndefineds } from '$lib/filterUndefineds';
import { unzip, zip } from '$lib/zip';
import { classifyLemmas } from '../ai/classifyLemmas';
import {
	generateExampleSentences as generateExampleSentencesAi,
	simplifySentences
} from '../ai/generateExampleSentences';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { getLemmasOfWords } from '../db/lemmas';
import { getSentencesByText } from '../db/sentences';
import * as DB from '../db/types';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { lemmatizeSentences } from '../logic/lemmatize';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { toWordStrings } from './toWordStrings';
import { Language } from './types';

export async function generateExampleSentences(
	lemma: string,
	{
		language,
		level = 60
	}: {
		language: Language;
		level?: number;
	}
) {
	return eliminateDuplicates(
		await generateExampleSentencesAi(
			lemma,
			level < 20 ? 'beginner' : level < 40 ? 'easy' : 'normal',
			8,
			language
		),
		language
	);
}

export async function generatePersonalizedExampleSentences(
	lemma: string,
	{
		level = 60,
		hardLevel = Math.max(Math.round((level * 2) / 3), 10),
		retriesLeft = 1,
		count = 8,
		userId,
		language
	}: {
		level?: number;
		hardLevel?: number;
		retriesLeft?: number;
		count?: number;
		userId: number;
		language: Language;
	}
) {
	let sentences = await eliminateDuplicates(
		await generateExampleSentencesAi(
			lemma,
			level < 20 ? 'beginner' : level < 40 ? 'easy' : 'normal',
			count,
			language
		),
		language
	);

	let graded = await gradeSentences(sentences, { exceptLemma: lemma, hardLevel, userId, language });

	console.log(
		`Got example sentences for ${lemma}: ${sentences
			.map(
				(sentence, i) =>
					`\n ${i}) ` +
					sentence.slice(0, 100) +
					(sentence.length > 100 ? '...' : '') +
					' Hard: ' +
					graded[i].hard.join(', ')
			)
			.join('')}`
	);

	const simple = graded.filter(({ hard }) => !hard.length);

	if (!simple.length) {
		const almostSimple = graded.filter(({ hard }) => hard.length < 3);

		if (retriesLeft > 0 && !almostSimple.length) {
			console.log(`No simple sentences found. Retrying ${lemma} with level ${level / 2}`);

			graded = graded.concat(
				await generatePersonalizedExampleSentences(lemma, {
					level: level / 2,
					hardLevel,
					retriesLeft: retriesLeft - 1,
					userId,
					language
				})
			);
		} else if (almostSimple.length) {
			console.log(
				`${almostSimple.length} sentences for ${lemma} were almost simple. Simplifying...`
			);

			let simplified = (await simplifySentences(almostSimple, lemma, language)).filter(
				(s) => !sentences.some((sentence) => sentence.toLowerCase() === s.toLowerCase())
			);

			graded = almostSimple.concat(
				await gradeSentences(simplified, { exceptLemma: lemma, hardLevel, userId, language })
			);
		} else {
			const sorted = graded.sort((a, b) => a.hard.length - b.hard.length);

			const simplest = graded.filter(
				({ hard }) => hard.length <= sorted[Math.floor(sorted.length / 2)].hard.length
			);

			graded = simplest.concat(
				await gradeSentences(
					(await simplifySentences(simplest, lemma, language)).filter(
						(s) => !sentences.some((sentence) => sentence.toLowerCase() === s.toLowerCase())
					),
					{ exceptLemma: lemma, hardLevel, userId, language }
				)
			);
		}
	}

	graded = graded.sort((a, b) => a.hard.length - b.hard.length).slice(0, count);

	const foundSimple = graded.some(({ hard }) => !hard.length);

	if (!foundSimple) {
		console.error(`None of the sentences found for ${lemma} were simple.`);
	} else {
		console.log(
			`Got simple sentences for ${lemma}: ${graded
				.filter(({ hard }) => !hard.length)
				.map(({ sentence }, i) => `\n ${i}) ` + sentence.slice(0, 100))
				.join('')}`
		);
	}

	return graded;
}

async function gradeSentences(
	sentences: string[],
	{
		userId,
		exceptLemma,
		hardLevel,
		language
	}: { exceptLemma: string; hardLevel: number; userId: number; language: Language }
) {
	const res = await quickAndDirtyToWords(sentences, { language });
	const { words, lemmas } = res;

	const knowledge = await getAggregateKnowledgeForUserWords({
		wordIds: words.map(({ id }) => id),
		userId,
		language
	});

	const easyLemmasSet = new Set(
		words
			.filter((word) => word.word == exceptLemma || !isHard(word, knowledge, hardLevel))
			.map(({ word }) => word)
	);

	return sentences.map((sentence, i) => ({
		sentence,
		hard: lemmas[i].filter((lemma) => !easyLemmasSet.has(lemma))
	}));
}

const isHard = (word: DB.Word, knowledge: DB.AggKnowledgeForUser[], hardLevel: number): boolean => {
	const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

	if (word.type == 'cognate' || word.type == 'name') {
		return false;
	}

	if (wordKnowledge) {
		return expectedKnowledge(wordKnowledge, { now: now(), exercise: 'read' }) < 0.6;
	} else {
		return word.level > hardLevel;
	}
};

export async function quickAndDirtyToWords(
	sentences: string[],
	{ language }: { language: Language }
) {
	const wordStrings = sentences.map((sentence) =>
		toWordStrings(sentence, language, { doLowerCase: true })
	);

	const allWordStrings = dedup(wordStrings.flat());
	const words = (await getLemmasOfWords(allWordStrings, language)).map(
		(words) => words.sort((a, b) => a.level - b.level)[0] as DB.Word | undefined
	);

	const lemmaByWordString = new Map<string, string>(
		zip(allWordStrings, words)
			.filter(([wordString, word]) => word)
			.map(([wordString, word]) => [wordString, word!.word] as [string, string])
	);

	return {
		words: filterUndefineds(words),
		lemmas: wordStrings.map((wordStrings) =>
			wordStrings.map((wordString) => lemmaByWordString.get(wordString) || wordString)
		)
	};
}

export async function toDbWords(sentences: string[], { language }: { language: Language }) {
	let lemmas = await lemmatizeSentences(sentences, { language });

	const words = await getMultipleWordsByLemmas(dedup(lemmas.flat()), language);

	let missingWords = lemmas.flat().filter((lemma) => !words.some((word) => word.word === lemma));

	if (missingWords.length) {
		const wordsAdded = await addWords(missingWords, language);

		words.push(...wordsAdded);

		[sentences, lemmas] = unzip(
			zip(sentences, lemmas).filter(([sentence, lemmas]) => {
				const foundAllLemmas = lemmas.every((lemma) => words.some((word) => word.word === lemma));

				if (!foundAllLemmas) {
					console.warn(
						`Could not find all lemmas for sentence: ${sentence}. Got ${lemmas
							.filter((lemma) => words.some((word) => word.word === lemma))
							.join(
								', '
							)}. Missing: ${lemmas.filter((lemma) => !words.some((word) => word.word === lemma)).join(', ')}`
					);
				}

				return foundAllLemmas;
			})
		);
	}

	return { words, lemmas, sentences };
}

export async function addWords(wordStrings: string[], language: Language) {
	if (!wordStrings.length) {
		throw new Error('No words to add');
	}

	const lemmaTypes = await classifyLemmas(wordStrings, { language, throwOnInvalid: false });

	return filterUndefineds(
		await Promise.all(
			lemmaTypes.map(({ lemma, type }) => {
				if (type == 'inflection' || type == 'wrong') {
					console.warn(`Invalid lemma: ${lemma} (${type}).`);
					return undefined;
				} else {
					return addWord(lemma, {
						type: type as DB.WordType | null,
						language
					}).catch((e) => {
						console.error(`Failed to add word ${lemma} to the database: ${e}`);
						return undefined;
					});
				}
			})
		)
	);
}

async function eliminateDuplicates(sentences: string[], language: Language) {
	const existingSentences = await getSentencesByText(sentences, language);

	if (!!existingSentences.length) {
		console.log(`Generated ${existingSentences.length} sentence duplicates. Discarding.`);
	}

	return sentences.filter(
		(sentence) =>
			!existingSentences.some((existingSentence) => existingSentence.sentence == sentence)
	);
}
