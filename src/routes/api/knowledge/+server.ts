import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { storeSentenceDone } from '../../../db/wordsKnown';
import { getAggregateKnowledge } from '../../../logic/getAggregateKnowledge';
import { addKnowledge } from '../../../logic/knowledge';
import { wordKnowledgeSchema } from '../../../logic/types';
import { userId } from '../../../logic/user';

export const POST: ServerLoad = async ({ request }) => {
	let { words, didSentence } = z
		.object({
			words: z.array(wordKnowledgeSchema),
			didSentence: z.boolean(),
			wordsKnown: z.number().optional()
		})
		.parse(await request.json());

	await addKnowledge(words);

	if (didSentence) {
		await storeSentenceDone(userId);
	}

	return json({});
};

export const GET: ServerLoad = async ({}) => {
	let knowledge = await getAggregateKnowledge();

	return json(knowledge);
};
