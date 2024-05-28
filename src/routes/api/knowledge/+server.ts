import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { storeSentenceDone } from '../../../db/wordsKnown';
import { getAggregateKnowledge } from '../../../logic/getAggregateKnowledge';
import { addKnowledge } from '../../../logic/knowledge';
import { wordKnowledgeSchema } from '../../../logic/types';

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	let { words, didSentence } = z
		.object({
			words: z.array(wordKnowledgeSchema),
			didSentence: z.boolean(),
			wordsKnown: z.number().optional()
		})
		.parse(await request.json());

	await addKnowledge(
		words.map((word) => ({ ...word, userId: userId! })),
		language
	);

	if (didSentence) {
		await storeSentenceDone(userId!, language);
	}

	return json({});
};

export const GET: ServerLoad = async ({ locals: { userId, language } }) => {
	let knowledge = await getAggregateKnowledge(userId!, language);

	return json(knowledge);
};
