import { linearRegression } from 'simple-statistics';
import {
	addAggregateKnowledgeUnlessExists,
	getRawKnowledgeJoinedWithWordsForUser,
	setBetaIfNull
} from '../db/knowledge';
import { KNOWLEDGE_TYPE_READ } from '../db/knowledgeTypes';
import { ExerciseSource } from '../db/types';
import { getWords } from '../db/words';
import { calculateWordsKnown } from '../logic/isomorphic/wordsKnown';
import { Language } from '../logic/types';
import { now } from './isomorphic/knowledge';

export async function calculateTestResult({
	userId,
	language,
	type
}: {
	userId: number;
	language: Language;
	type: number;
}) {
	const isWrite = type != KNOWLEDGE_TYPE_READ;

	const rawKnowledge = await getRawKnowledgeJoinedWithWordsForUser({ userId, language, type });

	if (rawKnowledge.length == 0) {
		throw new Error(`No knowledge of type ${type} found for user`);
	}

	const regression = linearRegression(rawKnowledge.map((k) => [k.level, k.knew ? 1 : 0]));

	// Extract the slope and intercept
	let { m: slope, b: intercept } = regression;

	// Predicting new values (example)
	const predict = (level: number) => slope * level + intercept;

	console.log(
		`Reading test result for ${userId}: Slope: ${slope}, Intercept: ${intercept}: ${[0, 50, 99]
			.map((level) => `level ${level}: ${Math.round(predict(level) * 100)}%`)
			.join(', ')}`
	);

	if (isNaN(slope)) {
		throw new Error(`The slope is ${slope}, which is not expected`);
	}

	if (slope > 0) {
		console.warn(`The slope is ${slope}; it should be negative.`);
		slope = 0;
	}

	const words = await getWords('level asc', language);
	const knowledge: {
		alpha: number;
		beta: number | null;
		wordId: number;
		lastTime: number;
		source: ExerciseSource;
	}[] = [];

	const lastTime = now();

	let highestLevel = 0;

	for (const word of words) {
		const proficiency = predict(word.level);

		if (proficiency > 0.5) {
			highestLevel = word.level;

			knowledge.push({
				alpha: Math.min(proficiency, 1),
				beta: isWrite ? Math.min(proficiency, 1) : null,
				wordId: word.id,
				lastTime,
				source: 'studied'
			});
		}
	}

	console.log(`Adding ${knowledge.length} words to knowledge of user ${userId}`);

	await addAggregateKnowledgeUnlessExists(knowledge, userId, language);

	if (isWrite) {
		await setBetaIfNull(knowledge, userId, language);
	}

	return {
		level: highestLevel,
		vocabularySize: calculateWordsKnown(knowledge),
		languageCode: language.code
	};
}
