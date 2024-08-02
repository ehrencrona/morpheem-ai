import type { Language, WordKnowledge } from './types';

import { parallelize } from '$lib/parallelize';
import { addKnowledge as addKnowledgeToDb, transformAggregateKnowledge } from '../db/knowledge';
import { knowledgeTypeToExercise } from '../db/knowledgeTypes';
import {
	didNotKnow,
	didNotKnowFirst,
	knew,
	knewFirst,
	now as getNow
} from './isomorphic/knowledge';
import { getWordRelations } from '../db/wordRelations';

export async function updateKnowledge(words: WordKnowledge[], language: Language) {
	words = eliminateDuplicates(words);

	await addKnowledgeToDb(words, language);

	console.log(`Storing knowledge for words ${words.map((word) => word.wordId).join(', ')}`);

	const now = getNow();

	await parallelize(
		words.map((wordKnowledge) => async () => {
			const exercise = knowledgeTypeToExercise(wordKnowledge.type);

			await transformAggregateKnowledge(
				wordKnowledge,
				(existing) => {
					if (!existing) {
						return wordKnowledge.isKnown ? knewFirst(exercise) : didNotKnowFirst(exercise);
					} else {
						return (wordKnowledge.isKnown ? knew : didNotKnow)(existing, { now, exercise });
					}
				},
				language
			);

			let related = await getWordRelations(wordKnowledge.wordId, language);

			if (related) {
				for (const relation of related) {
					await transformAggregateKnowledge(
						{ userId: wordKnowledge.userId, wordId: relation.id },
						(existing) => {
							if (!existing) {
								return wordKnowledge.isKnown ? knewFirst(exercise) : didNotKnowFirst(exercise);
							} else {
								return (wordKnowledge.isKnown ? knew : didNotKnow)(existing, {
									now,
									exercise
								});
							}
						},
						language
					);
				}
			}
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
