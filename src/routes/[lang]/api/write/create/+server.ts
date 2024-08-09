import { redirectToLogin } from '$lib/redirectToLogin';
import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { toTargetLanguage } from '../../../../../ai/toTargetLanguage';
import { UserExercise, UserExerciseWithSentence } from '../../../../../db/types';
import { upsertUserExercise } from '../../../../../db/userExercises';
import { addSentence } from '../../../../../logic/addSentence';
import { didNotKnowFirst, now } from '../../../../../logic/isomorphic/knowledge';
import { lemmatizeSentences } from '../../../../../logic/lemmatize';

const createSchema = z.object({
	sentence: z.string()
});

export type PostSchema = z.infer<typeof createSchema>;

export const POST: ServerLoad = async ({ url, request, locals: { language, userId } }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const query = createSchema.parse(await request.json());

	const sentenceString = await toTargetLanguage(query.sentence, { language });

	const lemmas = (await lemmatizeSentences([sentenceString], { language }))[0];

	const sentence = await addSentence(sentenceString, { language, lemmas, english: undefined });

	const userExercise: UserExercise = {
		exercise: 'translate',
		id: null,
		sentenceId: sentence.id,
		level: 0,
		lastTime: now(),
		...didNotKnowFirst('cloze')
	};

	await upsertUserExercise(userExercise, userId, language);

	return json({ ...userExercise, sentence } satisfies UserExerciseWithSentence);
};
