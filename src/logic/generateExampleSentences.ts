import { filterUndefineds } from '$lib/filterUndefineds';
import { classifyLemmas } from '../ai/classifyLemmas';
import { findIncorrectSentences } from '../ai/findIncorrectSentences';
import {
	generateExampleSentences as generateExampleSentencesAi,
	simplifySentences
} from '../ai/generateExampleSentences';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import * as DB from '../db/types';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { lemmatizeSentences } from '../logic/lemmatize';
import { expectedKnowledge, now } from './isomorphic/knowledge';
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
	let sentences = await generateExampleSentencesAi(
		lemma,
		level < 20 ? 'beginner' : level < 40 ? 'easy' : 'normal',
		8,
		language
	);

	const words = await toWords(sentences, { language });

	return words.sentences.map((sentence, i) => ({ sentence, lemmas: words.lemmas[i] }));
}

export async function generatePersonalizedExampleSentences(
	lemma: string,
	{
		level = 60,
		hardLevel = Math.max(Math.round((level * 2) / 3), 10),
		retriesLeft = 1,
		userId,
		language
	}: {
		level?: number;
		hardLevel?: number;
		retriesLeft?: number;
		userId: number;
		language: Language;
	}
) {
	let sentences = await generateExampleSentencesAi(
		lemma,
		level < 20 ? 'beginner' : level < 40 ? 'easy' : 'normal',
		8,
		language
	);

	let graded = await gradeSentences(sentences, { exceptLemma: lemma, hardLevel, userId, language });

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

			// not entirely sure this is needed. check if the warning below appears, if not remove it.
			const incorrectIndices = (
				await findIncorrectSentences(
					simplified.map((sentence, i) => ({ sentence, id: i + 1 })),
					language
				)
			).map((i) => i - 1);

			if (incorrectIndices.length) {
				console.warn(
					`Simplify produced incorrect sentences: \n${incorrectIndices
						.map((i) => simplified[i])
						.join('\n')}`
				);

				simplified = simplified.filter((_, i) => !incorrectIndices.includes(i));
			}

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
	} else {
		console.log(
			`These sentences for ${lemma} were simple: ${simple.map(({ sentence }, i) => `\n ${i}) ` + sentence.slice(0, 100)).join('')}`
		);

		graded = simple;
	}

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
	const res = await toWords(sentences, { language });
	const { words, lemmas } = res;

	// it might discard invalid sentences.
	sentences = res.sentences;

	const knowledge = await getAggregateKnowledgeForUserWords({
		wordIds: words.map(({ id }) => id),
		userId,
		language
	});

	const hardWords = words.filter(
		(word) => word.word != exceptLemma && isHard(word, knowledge, hardLevel)
	);

	const hardLemmas = hardWords
		.map(({ word }) => word)
		.concat(lemmas.flat().filter((lemma) => !words.some((word) => word.word === lemma)));

	const hardLemmasSet = new Set(hardLemmas);

	return sentences.map((sentence, i) => ({
		sentence,
		lemmas: lemmas[i],
		hard: lemmas[i].filter((lemma) => hardLemmasSet.has(lemma))
	}));
}

const isHard = (word: DB.Word, knowledge: DB.AggKnowledgeForUser[], hardLevel: number): boolean => {
	const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

	if (word.type == 'cognate' || word.type == 'name') {
		return false;
	}

	if (wordKnowledge && expectedKnowledge(wordKnowledge, { now: now(), exercise: 'read' }) < 0.6) {
		return true;
	}

	return word.level > hardLevel;
};

export async function toWords(sentences: string[], { language }: { language: Language }) {
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

function zip<A, B>(a: A[], b: B[]): [A, B][] {
	if (a.length != b.length) {
		throw new Error('Arrays must be of the same length');
	}

	return a.map((a, i) => [a, b[i]]);
}

function unzip<A, B>(ab: [A, B][]): [A[], B[]] {
	return ab.reduce(
		(acc, [a, b]) => {
			acc[0].push(a);
			acc[1].push(b);
			return acc;
		},
		[[], []] as [A[], B[]]
	);
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

function dedup(array: string[]) {
	return [...new Set(array)];
}
