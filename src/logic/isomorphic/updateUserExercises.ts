import { toPercent } from '$lib/toPercent';
import * as DB from '../../db/types';
import type { ExerciseKnowledge } from '../types';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './knowledge';

function toSentenceWord(e: { sentenceId: number; wordId: number | null }): string {
	return e.sentenceId + '' + e.wordId;
}

export function updateUserExercises(adds: ExerciseKnowledge[], exercises: DB.UserExercise[]) {
	const bySentenceWord = new Map(adds.map((e) => [toSentenceWord(e), e]));

	for (const { exercise, wordId } of exercises) {
		const shouldHaveWord = exercise != 'translate' && exercise != 'write';

		if (shouldHaveWord != (wordId != null)) {
			throw new Error(`WordId was ${wordId} for exercise ${exercise}`);
		}
	}

	exercises = exercises.map((e) => {
		const lastTime = now();
		const sentenceWord = toSentenceWord(e);

		if (bySentenceWord.has(sentenceWord)) {
			const add = bySentenceWord.get(sentenceWord)!;
			bySentenceWord.delete(sentenceWord);

			const opts = { now: lastTime, exercise: e.exercise };
			const newExercise = {
				...e,
				...(add.isKnown ? knew(e, opts) : didNotKnow(e, opts)),
				lastTime,
				exercise: add.exercise
			};

			console.log(
				`Updated user exercise for word ${add.word} (${add.wordId}) and sentence ${add.sentenceId}. exercise: ${add.exercise}, alpha: ${toPercent(newExercise.alpha)} beta: ${toPercent(newExercise.beta)}`
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
				`New user exercise for word ${e.word} (${e.wordId}) and sentence ${e.sentenceId}. exercise: ${e.exercise}, alpha: ${toPercent(e.alpha)} beta: ${toPercent(e.beta)}`
			);
		}
	}

	return exercises;
}
