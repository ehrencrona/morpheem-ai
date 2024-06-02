import type { AggKnowledgeForUser, Exercise, Language, WordKnowledge } from './types';

import { addKnowledge as addKnowledgeToDb, transformAggregateKnowledge } from '../db/knowledge';
import { getWordsBelowLevel } from '../db/words';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './isomorphic/knowledge';
import { knowledgeTypeToExercise } from '../db/knowledgeTypes';
import { parallelize } from '$lib/parallelize';

export async function addKnowledge(words: WordKnowledge[], language: Language) {
	words = eliminateDuplicates(words);

	await addKnowledgeToDb(words, language);

	console.log(`Storing knowledge ${words.map((word) => word.wordId).join(', ')}`);

	await parallelize(
		words.map((wordKnowledge) => async () => {
			await transformAggregateKnowledge(
				wordKnowledge,
				(existing) => {
					const exercise = knowledgeTypeToExercise(wordKnowledge.type);

					if (!existing) {
						return wordKnowledge.isKnown ? knewFirst(exercise) : didNotKnowFirst(exercise);
					} else {
						return (wordKnowledge.isKnown ? knew : didNotKnow)(existing, { now: now(), exercise });
					}
				},
				language
			);
		}),
		10
	);
}

/** TODO */
export async function getBeginnerKnowledge(language: Language): Promise<AggKnowledgeForUser[]> {
	const words = await getWordsBelowLevel(10, language);

	return words.slice(0, 4).map((word) => ({
		wordId: word.id,
		level: word.level,
		word: word.word,
		lastTime: now(),
		alpha: 1,
		beta: 1
	}));
}

function eliminateDuplicates(words: WordKnowledge[]) {
	const seen = new Set<number>();
	const unique = [];

	for (const word of words) {
		const { wordId } = word;

		if (!seen.has(wordId)) {
			seen.add(wordId);

			unique.push(word);
		} else {
			const index = unique.findIndex((uniqueWord) => uniqueWord.wordId === wordId);

			if (index >= 0) {
				unique[index].isKnown = word.isKnown && unique[index].isKnown;
			}
		}
	}

	return unique;
}
