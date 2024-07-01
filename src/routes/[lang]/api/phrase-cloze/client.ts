import type { evaluatePhraseCloze } from '../../../../ai/evaluatePhraseCloze';
import { apiCall } from '../api-call';
import { PostSchema } from './+server';

export async function fetchPhraseClozeEvaluation(
	opts: PostSchema
): ReturnType<typeof evaluatePhraseCloze> {
	return apiCall(`/api/phrase-cloze`, {
		method: 'POST',
		body: JSON.stringify(opts)
	});
}
