import { ServerLoad, json } from '@sveltejs/kit';
import { deleteUserExercise } from '../../../../../db/userExercises';

export const DELETE: ServerLoad = async ({ params, locals: { language, userId } }) => {
	if (!userId) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const exerciseId = parseInt(params.id || '');

	if (isNaN(exerciseId)) {
		throw new Error('Invalid word ID');
	}

	await deleteUserExercise(exerciseId, userId, language);

	return json({ success: true });
};
