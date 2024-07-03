import { exerciseToString } from '$lib/exerciseToString';
import * as DB from '../../db/types';

export function updateUserExercises(
	{ deleted, upserted }: { deleted: number[]; upserted: DB.UserExercise[] },
	exercises: DB.UserExercise[]
) {
	const upsertedById = new Map(upserted.map((e) => [e.id, e]));

	exercises = exercises.map((e) => {
		if (upsertedById.has(e.id)) {
			e = upsertedById.get(e.id)!;
			upsertedById.delete(e.id);

			console.log(`Updated user exercise ${exerciseToString(e)}`);

			return e;
		} else {
			return e;
		}
	});

	if (upsertedById.size) {
		const newExercises: DB.UserExercise[] = [...upsertedById.values()];

		exercises = [...exercises, ...newExercises];

		for (const e of newExercises) {
			console.log(`New user exercise ${exerciseToString(e)}`);
		}
	}

	exercises = exercises.filter((e) => !deleted.includes(e.id || -1));

	return exercises;
}
