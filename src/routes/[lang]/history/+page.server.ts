import { formatMinutes } from '$lib/formatMinutes';
import { redirectToLogin } from '$lib/redirectToLogin';
import { type ServerLoad } from '@sveltejs/kit';
import { getRecentKnowledge, getRecentReadSentences } from '../../../db/knowledge';
import { getSentencesByIds } from '../../../db/sentences';
import { getUserExercises } from '../../../db/userExercises';
import { getActivity } from '../../../db/wordsKnown';
import { getRecentWrittenSentences } from '../../../db/writtenSentences';
import { timeToDate } from '../../../logic/isomorphic/knowledge';

export const load = (async ({ locals, url }) => {
	const { language } = locals;

	if (!locals.user) {
		return redirectToLogin(url);
	}

	const userId = locals.user.num;

	const [exercises, knowledge, writtenSentences, readSentences, activity] = await Promise.all([
		getUserExercises({ userId, language, orderBy: 'last_time desc', limit: 20 }),
		getRecentKnowledge({
			userId,
			language
		}),
		getRecentWrittenSentences({ userId, language }),
		getRecentReadSentences({ userId, language }),
		getActivity(userId, language)
	]);

	const exerciseSentences = await getSentencesByIds(
		exercises.map((exercise) => exercise.sentenceId),
		language
	);

	return {
		knowledge,
		writtenSentences,
		readSentences,
		activity,
		exercises: exercises
			.map((exercise) => ({
				sentence: exerciseSentences.find((sentence) => sentence.id === exercise.sentenceId),
				...exercise,
				timeAgo: formatMinutes((Date.now() - timeToDate(exercise.lastTime).getTime()) / 60000)
			}))
			.filter((exercise) => !!exercise.sentence)
	};
}) satisfies ServerLoad;
