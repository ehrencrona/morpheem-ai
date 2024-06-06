import { toPercent } from '$lib/toPercent';
import * as DB from '../../db/types';
import type { ExerciseKnowledge } from '../types';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './knowledge';

export function updateUserExercises(adds: ExerciseKnowledge[], exercises: DB.UserExercise[]) {
	const bySentenceWord = new Map(adds.map((e) => [e.sentenceId, e]));

	exercises = exercises.map((e) => {
		const lastTime = now();

		if (bySentenceWord.has(e.sentenceId)) {
			const add = bySentenceWord.get(e.sentenceId)!;
			bySentenceWord.delete(e.sentenceId);

			const opts = { now: lastTime, exercise: e.exercise };
			const newExercise = {
				...e,
				...(add.isKnown ? knew(e, opts) : didNotKnow(e, opts)),
				lastTime,
				exercise: add.exercise
			};

			console.log(
				`Updated user exercise for word ${add.wordId} and sentence ${add.sentenceId}. exercise: ${add.exercise}, alpha: ${toPercent(newExercise.alpha)} beta: ${toPercent(newExercise.beta)}`
			);

			return newExercise;
		} else {
			return e;
		}
	});

	if (bySentenceWord.size) {
		const newExercises = [...bySentenceWord.values()].map((e) => ({
			...e,
			lastTime: now(),
			...(e.isKnown ? knewFirst(e.exercise) : didNotKnowFirst(e.exercise))
		}));

		exercises = [...exercises, ...newExercises];

		for (const e of newExercises) {
			console.log(
				`New user exercise for word ${e.wordId} and sentence ${e.sentenceId}. exercise: ${e.exercise}, alpha: ${toPercent(e.alpha)} beta: ${toPercent(e.beta)}`
			);
		}
	}

	return exercises;
}