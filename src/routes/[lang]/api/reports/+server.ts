import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { storeReport } from '../../../../db/reports';
import { logError } from '$lib/logError';

const postSchema = z.object({
	email: z.string(),
	sentenceId: z.number(),
	report: z.string().optional(),
	exercise: z.any().optional()
});

export type PostSchema = z.infer<typeof postSchema>;

export const POST: ServerLoad = async ({ request, locals: { userId, language } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const query = postSchema.parse(await request.json());

	await storeReport({ ...query, userId, language });

	logError(`Report from ${query.email} for sentence ${query.sentenceId}: ${query.report}`);

	return json({});
};
