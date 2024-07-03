import { toPercent } from '$lib/toPercent';
import * as DB from '../../db/types';

export function updateUserExercises(
	{ deleted, upserted }: { deleted: number[]; upserted: DB.UserExercise[] },
	exercises: DB.UserExercise[]
) {
	const upsertedById = new Map(upserted.map((e) => [e.id, e]));

	exercises = exercises.map((e) => {
		if (upsertedById.has(e.id)) {
			const add = upsertedById.get(e.id)!;
			upsertedById.delete(e.id);

			console.log(
				`Updated user exercise ${e.id} for ${'word' in add ? `word ${add.word} (${add.wordId})` : ''} and sentence ${add.sentenceId}. exercise: ${add.exercise}, alpha: ${toPercent(e.alpha)} beta: ${toPercent(e.beta)}`
			);

			return e;
		} else {
			return e;
		}
	});

	if (upsertedById.size) {
		const newExercises: DB.UserExercise[] = [...upsertedById.values()];

		exercises = [...exercises, ...newExercises];

		for (const e of newExercises) {
			console.log(
				`New user exercise ${e.id} of type ${e.exercise}${'word' in e ? ` for word ${e.word} (${e.wordId})` : ''} and sentence ${e.sentenceId}. exercise: ${e.exercise}, alpha: ${toPercent(e.alpha)} beta: ${toPercent(e.beta)}`
			);
		}
	}

	exercises = exercises.filter((e) => !deleted.includes(e.id || -1));

	return exercises;
}
