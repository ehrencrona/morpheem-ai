import { toPercent } from '$lib/toPercent';
import * as DB from '../../db/types';
import type { ExerciseKnowledge } from '../types';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './knowledge';

export function updateUserExercises(adds: ExerciseKnowledge[], exercises: DB.UserExercise[]) {
	const maxId = Math.max(...exercises.map((e) => e.id));

	adds = adds.map((e, i) => ({ ...e, id: e.id != null ? e.id : maxId + i + 1 }));

	// for (const add of adds) {
	// 	const { exercise } = add;
	// 	const shouldHaveWord = ['read', 'write', 'cloze', 'cloze-inflection'].includes(exercise);
	// 	const hasWord = 'wordId' in add && !!add.wordId;

	// 	if (shouldHaveWord && !hasWord) {
	// 		throw new Error(`Word ID was missing for user exercise ${JSON.stringify(exercise)}`);
	// 	} else if (!shouldHaveWord && hasWord) {
	// 		console.warn(`Word ID should not be set for user exercise ${JSON.stringify(exercise)}`);
	// 	}
	// }

	const byId = new Map(adds.map((e) => [e.id, e]));

	exercises = exercises.map((e) => {
		const lastTime = now();

		if (byId.has(e.id)) {
			const add = byId.get(e.id)!;
			byId.delete(e.id);

			const opts = { now: lastTime, exercise: e.exercise };
			const newExercise: DB.UserExercise = {
				...e,
				...(add.isKnown ? knew(e, opts) : didNotKnow(e, opts)),
				lastTime,
				exercise: add.exercise as any
			};

			console.log(
				`Updated user exercise ${e.id} for ${'word' in add ? `word ${add.word} (${add.wordId})` : ''} and sentence ${add.sentenceId}. ${add.isKnown ? 'knew' : 'did not know'}. exercise: ${add.exercise}, alpha: ${toPercent(newExercise.alpha)} beta: ${toPercent(newExercise.beta)}`
			);

			return newExercise;
		} else {
			return e;
		}
	});

	if (byId.size) {
		const newExercises: DB.UserExercise[] = [...byId.values()].map((e) => ({
			...e,
			id: e.id!,
			lastTime: now(),
			...(e.isKnown ? knewFirst(e.exercise) : didNotKnowFirst(e.exercise))
		}));

		exercises = [...exercises, ...newExercises];

		for (const e of newExercises) {
			console.log(
				`New user exercise ${e.id} of type ${e.exercise}${'word' in e ? ` for word ${e.word} (${e.wordId})` : ''} and sentence ${e.sentenceId}. exercise: ${e.exercise}, alpha: ${toPercent(e.alpha)} beta: ${toPercent(e.beta)}`
			);
		}
	}

	return { exercises, addUserExercises: adds };
}
