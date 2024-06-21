import { toPercent } from '$lib/toPercent';
import { knowledgeTypeToExercise } from '../../db/knowledgeTypes';
import * as DB from '../../db/types';
import { WordKnowledge } from '../types';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './knowledge';

export function updateKnowledge(
	add: (WordKnowledge & { word: DB.Word })[],
	knowledge: DB.AggKnowledgeForUser[]
) {
	const byWord = new Map(add.map((w) => [w.wordId, w]));

	knowledge = knowledge.map((k) => {
		const word = byWord.get(k.wordId);

		const lastTime = now();

		if (word) {
			byWord.delete(k.wordId);

			const opts = { now: lastTime, exercise: knowledgeTypeToExercise(word.type) };

			let aggKnowledge: DB.AggKnowledgeForUser;

			const { wordId, word: wordString, level, wordType } = k;

			aggKnowledge = {
				wordId,
				word: wordString,
				level,
				wordType,
				lastTime,
				...(word.isKnown ? knew(k, opts) : didNotKnow(k, opts)),
				source: 'studied'
			};

			console.log(
				`Updated knowledge for word ${k.word} (${k.wordId}). knew: ${word.isKnown}, exercise: ${
					opts.exercise
				}, alpha: ${toPercent(aggKnowledge.alpha)} beta: ${toPercent(aggKnowledge.beta)}`
			);

			return aggKnowledge;
		} else {
			return k;
		}
	});

	if (byWord.size) {
		let newWords: DB.Word[] = Array.from(byWord.values()).map((w) => w.word);

		const newKnowledge = new Array(...byWord).map(([, k]) => {
			const exercise = knowledgeTypeToExercise(k.type);
			const word = newWords.find((w) => w.id === k.wordId)!;

			const aggKnowledge: DB.AggKnowledgeForUser = {
				wordId: k.wordId,
				lastTime: now(),
				word: word.word,
				level: word.level,
				wordType: word.type,
				source: 'studied',
				...(k.isKnown ? knewFirst(exercise) : didNotKnowFirst(exercise))
			};

			console.log(
				`New knowledge for word ${aggKnowledge.word} (${aggKnowledge.wordId}). knew: ${k.isKnown}, exercise: ${exercise}, alpha: ${toPercent(aggKnowledge.alpha)} beta: ${toPercent(aggKnowledge.beta)}`
			);

			return aggKnowledge;
		});

		knowledge = [...knowledge, ...newKnowledge];
	}

	return knowledge;
}
