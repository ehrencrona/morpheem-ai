import {
	generateExampleSentences as generateExampleSentencesAi,
	simplifySentences
} from '../ai/generateExampleSentences';
import { lemmatizeSentences } from '../ai/lemmatize';
import { translateSentences } from '../ai/translate';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { userId } from './user';
import * as DB from '../db/types';
import { AggKnowledgeForUser } from './types';
import { findCognates } from '../ai/cognates';

export async function generateExampleSentences(
	lemma: string,
	level = 60,
	hardLevel = Math.max(Math.round((level * 2) / 3), 10),
	retriesLeft = 1
) {
	let sentences = await generateExampleSentencesAi(
		lemma,
		level < 20 ? 'beginner' : level < 40 ? 'easy' : 'normal',
		8
	);

	let graded = await gradeSentences(sentences, lemma, hardLevel);

	const simple = graded.filter(({ hard }) => !hard.length);

	if (!simple.length) {
		const almostSimple = graded.filter(({ hard }) => hard.length == 1);

		if (retriesLeft > 0 && !almostSimple.length) {
			console.log(`No simple sentences found. Retrying ${lemma} with level ${level / 2}`);

			graded = graded.concat(
				await generateExampleSentences(lemma, level / 2, hardLevel, retriesLeft - 1)
			);
		} else if (almostSimple.length) {
			console.log(
				`${almostSimple.length} sentences for ${lemma} were almost simple. Simplifying...`
			);

			graded = almostSimple.concat(
				await gradeSentences(
					(await simplifySentences(almostSimple, lemma)).filter(
						(s) => !sentences.some((sentence) => sentence.toLowerCase() === s.toLowerCase())
					),
					lemma,
					hardLevel
				)
			);
		} else {
			const sorted = graded.sort((a, b) => a.hard.length - b.hard.length);

			const simplest = graded.filter(
				({ hard }) => hard.length <= sorted[Math.floor(sorted.length / 2)].hard.length
			);

			graded = simplest.concat(
				await gradeSentences(
					(await simplifySentences(simplest, lemma)).filter(
						(s) => !sentences.some((sentence) => sentence.toLowerCase() === s.toLowerCase())
					),
					lemma,
					hardLevel
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

	const englishes = await translateSentences(graded.map(({ sentence }) => sentence));

	return graded.map((g, i) => ({ ...g, english: englishes[i] }));
}

async function gradeSentences(sentences: string[], lemma: string, hardLevel: number) {
	const lemmas = await lemmatizeSentences(sentences);

	const words = await getMultipleWordsByLemmas(dedup(lemmas.flat()));

	let missingWords = lemmas.flat().filter((lemma) => !words.some((word) => word.word === lemma));

	if (missingWords.length) {
		const [cognates, lemmas] = await Promise.all([
			findCognates(missingWords),
			// try to double check that we actually got the dictionary form
			lemmatizeSentences([missingWords.join(' ')])
		]);

		missingWords = missingWords.filter((word) => {
			const isLemmaDoubleCheck = lemmas[0].includes(word);

			if (!isLemmaDoubleCheck) {
				console.warn(`Double check: ${word} not found in lemmas`);

				words.push({
					id: -1,
					word,
					level: 99,
					cognate: false
				});
			}

			return isLemmaDoubleCheck;
		});

		await Promise.all(
			missingWords.map(async (word) => words.push(await addWord(word, cognates.includes(word))))
		);
	}

	const knowledge = await getAggregateKnowledgeForUserWords({
		wordIds: words.map(({ id }) => id),
		userId
	});

	const hardWords = words.filter(
		(word) => word.word != lemma && isHard(word, knowledge, hardLevel)
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

const isHard = (word: DB.Word, knowledge: AggKnowledgeForUser[], hardLevel: number): boolean => {
	const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

	if (word.cognate) {
		return false;
	}

	if (
		wordKnowledge &&
		expectedKnowledge(wordKnowledge, { now: now(), lastTime: wordKnowledge.time }) < 0.6
	) {
		return true;
	}

	return word.level > hardLevel;
};

function dedup(array: string[]) {
	return [...new Set(array)];
}
