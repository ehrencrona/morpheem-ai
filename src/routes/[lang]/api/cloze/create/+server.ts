import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateCloze } from '../../../../../logic/generateCloze';
import { storeCloze } from '../../../../../logic/storeCloze';

const createSchema = z.object({
	skill: z.string(),
	noOfExercises: z.number()
});

const storeSchema = z.array(
	z.object({
		exercise: z.string(),
		answer: z.string()
	})
);

export type PostSchema = z.infer<typeof createSchema>;
export type PutSchema = z.infer<typeof storeSchema>;

export const POST: ServerLoad = async ({ request, locals: { language } }) => {
	const query = createSchema.parse(await request.json());

	return json(
		(await generateCloze(query.skill, {
			noOfExercises: query.noOfExercises,
			language
		})) satisfies PutSchema
	);
};

export const PUT: ServerLoad = async ({ request, locals: { userId, language } }) => {
	if (!userId) {
		throw new Error('Unauthorized');
	}

	const query = storeSchema.parse(await request.json());

	return json(await storeCloze(query, { userId, language }));
};
