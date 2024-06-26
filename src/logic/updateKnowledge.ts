import type { Language, WordKnowledge } from './types';

import { parallelize } from '$lib/parallelize';
import { addKnowledge as addKnowledgeToDb, transformAggregateKnowledge } from '../db/knowledge';
import { knowledgeTypeToExercise } from '../db/knowledgeTypes';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './isomorphic/knowledge';

export async function updateKnowledge(words: WordKnowledge[], language: Language) {
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
