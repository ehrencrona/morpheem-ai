import type { ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getAggregateKnowledgeForUser } from '../../../db/knowledge';
import { addKnowledge, getBeginnerKnowledge } from '../../../logic/knowledge';
import { wordKnowledgeSchema } from '../../../logic/types';
import { userId } from '../../../logic/user';

export const POST: ServerLoad = async ({ request }) => {
	let words = z.array(wordKnowledgeSchema).parse(await request.json());

	await addKnowledge(words);

	return new Response(JSON.stringify({}), {
		headers: {
			'content-type': 'application/json'
		}
	});
};

export const GET: ServerLoad = async ({}) => {
	let knowledge = await getAggregateKnowledgeForUser({ userId });

	if (knowledge.length === 0) {
		knowledge = await getBeginnerKnowledge();
	}

	return new Response(JSON.stringify(knowledge), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
