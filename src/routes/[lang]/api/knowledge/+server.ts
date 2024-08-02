import { redirectToLogin } from '$lib/redirectToLogin';
import { error, json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getUserSettings } from '../../../../db/userSettings';
import { storeSentenceDone } from '../../../../db/wordsKnown';
import { getAggregateKnowledge } from '../../../../logic/getAggregateKnowledge';
import { exerciseKnowledgeSchema, wordKnowledgeSchema } from '../../../../logic/types';
import { updateKnowledge } from '../../../../logic/updateKnowledge';
import { updateUserExercises } from '../../../../logic/updateUserExercises';

export const POST: ServerLoad = async ({ url, request, locals: { userId, language } }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	let { words, userExercises } = z
		.object({
			words: z.array(wordKnowledgeSchema),
			userExercises: z.array(exerciseKnowledgeSchema).optional()
		})
		.parse(await request.json());

	console.log(
		`Updating knowledge ${words
			.map((k) => `word ${k.wordId} ${k.isKnown ? 'knew' : 'did not know'}`)
			.join(', ')}` +
			(userExercises?.length
				? `, user exercises ${(
						userExercises?.map(
							(k) =>
								`${k.id}, ${k.exercise} ${'wordId' in k ? `word ${k.wordId}` : ''} sentence ${k.sentenceId} ${k.isKnown ? 'knew' : 'did not know'}`
						) || []
					).join(', ')}`
				: '') +
			` for user ${userId} in language ${language.code}`
	);

	const [result, a, b] = await Promise.all([
		updateUserExercises(userExercises || [], userId, language),
		updateKnowledge(
			words.map((word) => ({ ...word, userId })),
			language
		),
		storeSentenceDone(userId, language)
	]);

	return json(result);
};

export const GET: ServerLoad = async ({ locals: { userId, language } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const settings = await getUserSettings(userId, language);

	let knowledge = await getAggregateKnowledge(userId!, {
		language,
		upToUnit: settings?.unit || undefined
	});

	return json(knowledge, {
		headers: {
			'cache-control': 'no-cache'
		}
	});
};
