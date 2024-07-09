import { redirectToLogin } from '$lib/redirectToLogin';
import { type ServerLoad } from '@sveltejs/kit';
import { getSentencesByIds } from '../../../db/sentences';
import { getUserExercises } from '../../../db/userExercises';
import { timeToDate } from '../../../logic/isomorphic/knowledge';
import { formatMinutes } from '$lib/formatMinutes';

export const load: ServerLoad = async ({ url, params, locals: { language, userId } }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const exercises = await getUserExercises(userId, language, 'last_time desc');

	const sentences = await getSentencesByIds(
		exercises.map((exercise) => exercise.sentenceId),
		language
	);

	return {
		lang: language.code,
		exercises: exercises.map((exercise) => ({
			...exercise,
			sentence: sentences.find((sentence) => sentence.id === exercise.sentenceId),
			timeAgo: formatMinutes((Date.now() - timeToDate(exercise.lastTime).getTime()) / 60000)
		}))
	};
};
