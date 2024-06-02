import { apiCall } from '../api-call';
import { PostSchema } from './+server';

export async function fetchClozeEvaluation(opts: PostSchema): Promise<string> {
	return apiCall(`/api/cloze`, {
		method: 'POST',
		body: JSON.stringify(opts)
	});
}
