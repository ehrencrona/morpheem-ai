import { redirectToLogin } from '$lib/redirectToLogin';
import type { ServerLoad } from '@sveltejs/kit';
import { getUserExercises } from '../../../db/userExercises';
import { getSentencesByIds } from '../../../db/sentences';
import { UserExerciseWithSentence } from '../../../db/types';

export const load: ServerLoad = async ({ url, locals: { language, userId } }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const translateExercises = await getUserExercises({
		userId,
		language,
		orderBy: 'last_time desc',
		exercise: 'translate'
	});

	const sentences = await getSentencesByIds(
		translateExercises.map((exercise) => exercise.sentenceId),
		language
	);

	return {
		translateExercises: translateExercises.map(
			(exercise) =>
				({
					...exercise,
					sentence: sentences.find((sentence) => sentence.id === exercise.sentenceId)
				}) as UserExerciseWithSentence
		)
	};
};
