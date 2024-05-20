import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getAggregateKnowledge } from '../../../logic/getAggregateKnowledge';
import { addKnowledge } from '../../../logic/knowledge';
import { wordKnowledgeSchema } from '../../../logic/types';

export const POST: ServerLoad = async ({ request }) => {
	let words = z.array(wordKnowledgeSchema).parse(await request.json());

	await addKnowledge(words);

	return json({});
};

export const GET: ServerLoad = async ({}) => {
	let knowledge = await getAggregateKnowledge();

	return json(knowledge);
};
