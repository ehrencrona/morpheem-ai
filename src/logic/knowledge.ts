import type { AggKnowledgeForUser, WordKnowledge } from './types';

import { addKnowledge as addKnowledgeToDb, transformAggregateKnowledge } from '../db/knowledge';
import { getWords, getWordsBelowLevel } from '../db/words';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './isomorphic/knowledge';

export async function addKnowledge(words: WordKnowledge[]) {
	words = eliminateDuplicates(words);

	await parallelize(
		words.map((wordKnowledge) => async () => {
			await addKnowledgeToDb(wordKnowledge);

			await transformAggregateKnowledge(wordKnowledge, (existing) => {
				if (!existing) {
					return wordKnowledge.isKnown ? knewFirst() : didNotKnowFirst();
				} else {
					const time = { now: now(), lastTime: existing.time };

					return (wordKnowledge.isKnown ? knew : didNotKnow)(existing, time);
				}
			});
		}),
		10
	);
}

/** TODO */
export async function getBeginnerKnowledge(): Promise<AggKnowledgeForUser[]> {
	const words = await getWordsBelowLevel(10);

	return words.slice(0, 4).map((word) => ({
		wordId: word.id,
		level: word.level,
		time: now(),
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

export async function parallelize(
	promises: (() => Promise<any>)[],
	concurrency: number
): Promise<void> {
	let at = 0;

	function next(): Promise<void> {
		if (at < promises.length) {
			const index = at++;

			return promises[index]().then(next);
		}

		return Promise.resolve();
	}

	await Promise.all(Array.from({ length: concurrency }, next));
}
