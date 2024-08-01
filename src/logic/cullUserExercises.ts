import { UserExercise } from '../db/types';
import { deleteUserExercises } from '../db/userExercises';
import { dateToTime, timeToDate } from './isomorphic/knowledge';
import { Language } from './types';

const maxAgeMs = /* 1 week */ 1000 * 60 * 60 * 24 * 7;
const keepAtLeast = 40;

export async function cullUserExercises(
	exercises: (UserExercise & { id: number })[],
	{ userId, language }: { userId: number; language: Language }
) {
	const cutOffTime = dateToTime(new Date(Date.now() - maxAgeMs));

	exercises = exercises.sort((a, b) => b.lastTime - a.lastTime);

	let toDeleteIndex = exercises.findIndex((exercise) => exercise.lastTime < cutOffTime);

	if (toDeleteIndex >= 0) {
		toDeleteIndex = Math.max(toDeleteIndex, keepAtLeast);

		console.log(
			`Culling ${exercises.length - toDeleteIndex} exercises for user ${userId} in language ${language.code}.`
		);

		await deleteUserExercises(
			exercises.slice(toDeleteIndex).map(({ id }) => id),
			userId,
			language
		);
	}
}
