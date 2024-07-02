import { ServerLoad, json } from '@sveltejs/kit';
import { deleteUserExercise } from '../../../../../db/userExercises';

export const DELETE: ServerLoad = async ({ params, locals: { language } }) => {
	const exerciseId = parseInt(params.id || '');

	if (isNaN(exerciseId)) {
		throw new Error('Invalid word ID');
	}

	await deleteUserExercise(exerciseId, language);

	return json({ success: true });
};
