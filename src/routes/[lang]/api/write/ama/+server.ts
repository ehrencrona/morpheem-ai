import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { askMeAnythingRead, askMeAnythingWrite } from '../../../../../ai/askMeAnything';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z
	.object({
		exercise: z.literal('write').or(z.literal('translate')),
		sentenceEntered: z.string().optional(),
		sentenceCorrected: z.string().optional(),
		correctTranslation: z.string().optional(),
		sentence: z.string().optional(),
		word: z.string().optional(),
		question: z.string()
	})
	.or(
		z.object({
			exercise: z.literal('read').or(z.literal('cloze')),
			question: z.string(),
			sentence: z.string(),
			translation: z.string().optional(),
			word: z.string().optional(),
			confusedWord: z.string().optional(),
			revealed: z.array(z.object({ english: z.string(), word: z.string() }))
		})
	);

export const POST: ServerLoad = async ({ request, locals }) => {
	const params = postSchema.parse(await request.json());
	const { exercise } = params;

	if (exercise === 'write' || exercise === 'translate') {
		return json(
			await askMeAnythingWrite({
				...params,
				language: locals.language
			})
		);
	} else if (exercise === 'read' || exercise === 'cloze') {
		return json(
			await askMeAnythingRead({
				...params,
				language: locals.language
			})
		);
	} else {
		throw new Error('Invalid type');
	}
};
