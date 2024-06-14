import type { evaluateCloze } from '../../../../logic/evaluateCloze';
import { apiCall } from '../api-call';
import { PostSchema } from './+server';

export async function fetchClozeEvaluation(opts: PostSchema): ReturnType<typeof evaluateCloze> {
	return apiCall(`/api/cloze`, {
		method: 'POST',
		body: JSON.stringify(opts)
	});
}
