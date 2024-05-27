import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { askMeAnythingRead, askMeAnythingWrite } from '../../../../ai/askMeAnything';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z
	.object({
		type: z.literal('write'),
		sentenceEntered: z.string().optional(),
		sentenceCorrected: z.string().optional(),
		word: z.string(),
		question: z.string()
	})
	.or(
		z.object({
			type: z.literal('read').or(z.literal('cloze')),
			question: z.string(),
			sentence: z.string(),
			translation: z.string().optional(),
			word: z.string(),
			confusedWord: z.string().optional(),
			revealed: z.array(z.object({ english: z.string(), word: z.string() }))
		})
	);

export const POST: ServerLoad = async ({ request, locals }) => {
	const params = postSchema.parse(await request.json());

	if (params.type === 'write') {
		return json(await askMeAnythingWrite({ ...params, languagesSpoken: locals.user!.languages }));
	} else {
		return json(await askMeAnythingRead({ ...params, languagesSpoken: locals.user!.languages }));
	}
};
