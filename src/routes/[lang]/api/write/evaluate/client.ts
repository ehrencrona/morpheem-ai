import type { WriteEvaluation } from '../../../../../logic/evaluateWrite';
import { apiCall } from '../../api-call';
import type { PostSchema } from './+server';

export async function fetchWriteEvaluation(params: PostSchema): Promise<WriteEvaluation> {
	return apiCall(`/api/write/evaluate`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
