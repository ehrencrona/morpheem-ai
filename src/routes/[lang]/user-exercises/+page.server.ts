import { redirectToLogin } from '$lib/redirectToLogin';
import { type ServerLoad } from '@sveltejs/kit';
import { getSentencesByIds } from '../../../db/sentences';
import { getUserExercises } from '../../../db/userExercises';
import { timeToDate } from '../../../logic/isomorphic/knowledge';

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

function formatMinutes(minutes: number) {
	if (minutes < 60) {
		return `${Math.round(minutes)} minutes`;
	}

	const hours = minutes / 60;

	if (hours < 24) {
		return `${Math.round(hours)} hours`;
	}

	const days = hours / 24;

	if (days < 7) {
		return `${Math.round(days)} days`;
	}

	const weeks = days / 7;

	if (weeks < 4) {
		return `${Math.round(weeks)} weeks`;
	}

	const months = days / 30;

	if (months < 12) {
		return `${Math.round(months)} months`;
	}

	const years = months / 12;

	return `${Math.round(years)} years`;
}
