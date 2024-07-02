import { getUserExercise, upsertUserExercise } from '../db/userExercises';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './isomorphic/knowledge';
import type { ExerciseKnowledge, Language } from './types';

export function updateUserExercises(
	exercises: ExerciseKnowledge[],
	userId: number,
	language: Language
) {
	for (const exercise of exercises) {
		const shouldHaveWord = exercise.exercise != 'translate' && exercise.exercise != 'phrase-cloze';

		if (shouldHaveWord && exercise.wordId == undefined) {
			throw new Error(`Word ID was missing for user exercise ${JSON.stringify(exercise)}`);
		}

		if (
			exercise.exercise == 'phrase-cloze' &&
			(exercise.hint == undefined || exercise.phrase == undefined)
		) {
			throw new Error(
				`hint or phrase was missing for phrase-cloze exercise ${JSON.stringify(exercise)}`
			);
		}
	}

	return Promise.all(
		exercises.map(async (exercise) => {
			const existing = exercise.id
				? await getUserExercise(exercise.id, userId, language)
				: undefined;

			let knowledge: {
				alpha: number;
				beta: number | null;
			};

			if (existing) {
				knowledge = (exercise.isKnown ? knew : didNotKnow)(existing, {
					now: now(),
					exercise: exercise.exercise
				});
			} else {
				knowledge = exercise.isKnown
					? knewFirst(exercise.exercise)
					: didNotKnowFirst(exercise.exercise);
			}

			await upsertUserExercise(
				{
					...(existing || exercise),
					...knowledge,
					id: exercise.id!,
					exercise: exercise.exercise as any,
					lastTime: now()
				},
				userId,
				language
			);
		})
	);
}
