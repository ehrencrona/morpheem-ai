import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { askMeAnythingRead, askMeAnythingWrite } from '../../../../../ai/askMeAnything';
import { languages } from '../../../../../constants';
import { logError } from '$lib/logError';

export type PostSchema = z.infer<typeof postSchema>;

let requestsByUser: Record<
	number,
	{
		since: number;
		count: number;
	}
> = {};

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
			unknown: z.array(z.object({ english: z.string(), word: z.string() }))
		})
	);

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	const params = postSchema.parse(await request.json());
	const { exercise } = params;

	if (!userId) {
		return error(401, 'Unauthorized');
	}

	let count = requestsByUser[userId];

	if (!count || count.since < Date.now() - 5 * 60 * 1000) {
		count = { since: Date.now(), count: 1 };
		requestsByUser[userId] = count;
	} else {
		count.count++;

		if (count.count > 30) {
			await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

			logError(`User ${userId} hit AMA rate limit.`);

			return `Server overloaded, please try again later`;
		}
	}

	if (exercise === 'write' || exercise === 'translate') {
		return json(
			await askMeAnythingWrite({
				...params,
				language
			})
		);
	} else if (exercise === 'read' || exercise === 'cloze') {
		return json(
			await askMeAnythingRead({
				...params,
				language
			})
		);
	} else {
		throw new Error('Invalid type');
	}
};
