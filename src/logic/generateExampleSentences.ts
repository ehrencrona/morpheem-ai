import { findCognates } from '../ai/cognates';
import {
	generateExampleSentences as generateExampleSentencesAi,
	simplifySentences
} from '../ai/generateExampleSentences';
import { lemmatizeSentences } from '../logic/lemmatize';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import * as DB from '../db/types';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
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

	const { lemmas } = await toWords(sentences, { language });

	return sentences.map((sentence, i) => ({ sentence, lemmas: lemmas[i] }));
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
		const almostSimple = graded.filter(({ hard }) => hard.length == 1);

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

			graded = almostSimple.concat(
				await gradeSentences(
					(await simplifySentences(almostSimple, lemma, language)).filter(
						(s) => !sentences.some((sentence) => sentence.toLowerCase() === s.toLowerCase())
					),
					{ exceptLemma: lemma, hardLevel, userId, language }
				)
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
	const { words, lemmas } = await toWords(sentences, { language });

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

	if (word.cognate) {
		return false;
	}

	if (wordKnowledge && expectedKnowledge(wordKnowledge, { now: now(), exercise: 'read' }) < 0.6) {
		return true;
	}

	return word.level > hardLevel;
};

export async function toWords(sentences: string[], { language }: { language: Language }) {
	const lemmas = await lemmatizeSentences(sentences, { language });

	const words = await getMultipleWordsByLemmas(dedup(lemmas.flat()), language);

	let missingWords = lemmas.flat().filter((lemma) => !words.some((word) => word.word === lemma));

	if (missingWords.length) {
		const wordsAdded = await addWords(missingWords, language);

		for (const word of missingWords) {
			const addedWord = wordsAdded.find((w) => w.word === word);

			if (addedWord) {
				words.push(addedWord);
			} else {
				words.push({
					id: -1,
					word,
					level: 99,
					cognate: false
				});
			}
		}
	}

	return { words, lemmas };
}

export async function addWords(wordStrings: string[], language: Language) {
	if (!wordStrings.length) {
		throw new Error('No words to add');
	}

	const [cognates, lemmas] = await Promise.all([
		findCognates(wordStrings, language),
		// try to double check that we actually got the dictionary form
		lemmatizeSentences([wordStrings.join(' ')], { language })
	]);

	wordStrings = wordStrings.filter((word) => {
		const isLemmaDoubleCheck = lemmas[0].includes(word);

		if (!isLemmaDoubleCheck) {
			console.warn(`Double check: ${word} not found in lemmas`);
		}

		return isLemmaDoubleCheck;
	});

	return Promise.all(
		wordStrings.map((word) => addWord(word, { isCognate: cognates.includes(word), language }))
	);
}

function dedup(array: string[]) {
	return [...new Set(array)];
}
