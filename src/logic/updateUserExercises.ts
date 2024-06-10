import { getUserExercise, upsertUserExercise } from '../db/userExercises';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './isomorphic/knowledge';
import type { ExerciseKnowledge, Language } from './types';

export function updateUserExercises(
	exercises: ExerciseKnowledge[],
	userId: number,
	language: Language
) {
	for (const { exercise, wordId } of exercises) {
		const shouldHaveWord = exercise != 'translate' && exercise != 'write';

		if (shouldHaveWord != (wordId != null)) {
			throw new Error(`WordId was ${wordId} for exercise ${exercise}`);
		}
	}

	return Promise.all(
		exercises.map(async (exercise) => {
			const existing = await getUserExercise({ ...exercise, userId }, language);

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
					exercise: exercise.exercise
				},
				userId,
				language
			);
		})
	);
}
