import type { evaluateCloze } from '../../../../logic/evaluateCloze';
import { apiCall } from '../api-call';
import { PostSchema } from './+server';

export async function sendReport(opts: PostSchema): ReturnType<typeof evaluateCloze> {
	return apiCall(`/api/reports`, {
		method: 'POST',
		body: JSON.stringify(opts)
	});
}
