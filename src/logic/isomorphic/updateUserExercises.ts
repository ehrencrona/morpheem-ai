import { exerciseToString } from '$lib/exerciseToString';
import * as DB from '../../db/types';

export function updateUserExercises(
	{ deleted, upserted }: { deleted: number[]; upserted: DB.UserExercise[] },
	exercises: DB.UserExercise[]
) {
	const upsertedById = new Map(upserted.map((e) => [e.id, e]));

	exercises = exercises.map((existing) => {
		const replaceWith = upsertedById.get(existing.id)!;

		if (replaceWith) {
			upsertedById.delete(existing.id);

			console.log(`Updated user exercise ${exerciseToString(replaceWith)}`);

			return replaceWith;
		} else {
			return existing;
		}
	});

	if (upsertedById.size) {
		const newExercises: DB.UserExercise[] = [...upsertedById.values()];

		exercises = [...exercises, ...newExercises];

		for (const e of newExercises) {
			console.log(`New user exercise ${exerciseToString(e)}`);
		}
	}

	exercises = exercises.filter((e) => e.id == null || !deleted.includes(e.id));

	return exercises;
}
