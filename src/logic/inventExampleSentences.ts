import {
	inventExampleSentences as inventExampleSentencesAi,
	simplifySentences
} from '../ai/inventExampleSentences';
import { lemmatizeSentences } from '../ai/lemmatize';
import { translateSentences } from '../ai/translate';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { getMultipleWordsByLemmas } from '../db/words';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { userId } from './user';
import * as DB from '../db/types';

export async function inventExampleSentences(lemma: string, level = 60, count: number = 10) {
	let sentences = await inventExampleSentencesAi(lemma, count);

	const lemmas = await lemmatizeSentences(sentences);

	const words = await getMultipleWordsByLemmas(dedup(lemmas.flat()));

	const knowledge = await getAggregateKnowledgeForUserWords({
		wordIds: words.map(({ id }) => id),
		userId
	});

	const isHard = (word: DB.Word): boolean => {
		const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

		if (
			wordKnowledge &&
			expectedKnowledge(wordKnowledge, { now: now(), lastTime: wordKnowledge.time }) < 0.6
		) {
			return true;
		}

		return word.level > level && !word.cognate && word.word !== lemma;
	};

	const hardWords = words.filter(isHard);

	const hardLemmas = hardWords
		.map(({ word }) => word)
		.concat(lemmas.flat().filter((lemma) => !words.some((word) => word.word === lemma)));

	const hardLemmasSet = new Set(hardLemmas);

	const hardSentences = sentences.filter((sentence, i) =>
		lemmas[i].some((lemma) => hardLemmasSet.has(lemma))
	);

	sentences.forEach((sentence, i) => {
		console.log(
			`Sentence "${sentence}" has lemmas: ${words
				.filter(({ word }) => lemmas[i].includes(word))
				.map((w) => ` ${w.word} (${w.level})`)
				.join(',')}`
		);
	});

	const simplified = (await simplifySentences(hardSentences, hardLemmas, lemma)).filter(
		(s) => !sentences.some((sentence) => sentence.toLowerCase() === s.toLowerCase())
	);

	const [simplifiedLemmas, englishes] = await Promise.all([
		lemmatizeSentences(simplified),
		translateSentences(sentences.concat(simplified))
	]);

	return [
		...sentences.map((sentence, i) => ({ sentence, lemmatized: lemmas[i] })),
		...simplified.map((sentence, i) => ({ sentence, lemmatized: simplifiedLemmas[i] }))
	].map(({ sentence, lemmatized }, i) => ({
		sentence,
		lemmatized,
		english: englishes[i]
	}));
}

function dedup(array: string[]) {
	return [...new Set(array)];
}
