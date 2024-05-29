import { ServerLoad, redirect } from '@sveltejs/kit';
import {
	addAggregateKnowledgeUnlessExists,
	getRawKnowledgeForUser,
	getRawKnowledgeJoinedWithWordsForUser
} from '../../../../db/knowledge';
import { linearRegression } from 'simple-statistics';
import { getWords } from '../../../../db/words';
import { calculateWordsKnown } from '../../../../logic/isomorphic/wordsKnown';

export const load: ServerLoad = async ({ params, locals: { language, userId } }) => {
	if (!userId) {
		return redirect(302, `/${language.code}/login`);
	}

	const rawKnowledge = await getRawKnowledgeJoinedWithWordsForUser({ userId, language });

	const regression = linearRegression(rawKnowledge.map((k) => [k.level, k.knew ? 1 : 0]));

	// Extract the slope and intercept
	const { m: slope, b: intercept } = regression;

	if (slope >= 0) {
		throw new Error(`The slope is ${slope}, which is not expected`);
	}

	console.log('Slope:', slope);
	console.log('Intercept:', intercept);

	// Predicting new values (example)
	const predict = (level: number) => slope * level + intercept;

	if (predict(100) > 0.7) {
		throw new Error(`You're too good for this app.`);
	}

	const words = await getWords('level asc', language);
	const knowledge: {
		alpha: number;
		beta: number | null;
		wordId: number;
		lastTime: number;
	}[] = [];

	const lastTime = Date.now();

	for (const word of words) {
		const alpha = predict(word.level);

		if (alpha > 0.5) {
			knowledge.push({
				alpha: Math.min(alpha, 1),
				beta: null,
				wordId: word.id,
				lastTime
			});
		}
	}

	await addAggregateKnowledgeUnlessExists(knowledge, userId, language);

	return { vocabularySize: calculateWordsKnown(knowledge), languageCode: language.code };
};
