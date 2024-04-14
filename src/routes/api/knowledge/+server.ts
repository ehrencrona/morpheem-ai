import type { ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { addKnowledge } from '../../../db/knowledge';

const schema = z.array(
	z.object({
		wordId: z.number(),
		sentenceId: z.number(),
		userId: z.number(),
		isKnown: z.boolean()
	})
);

export const POST: ServerLoad = async ({ request }) => {
	const json = schema.parse(await request.json());

	for (const k of json) {
		addKnowledge(k);
	}

	return new Response(JSON.stringify({}), {
		headers: {
			'content-type': 'application/json'
		}
	});
};
