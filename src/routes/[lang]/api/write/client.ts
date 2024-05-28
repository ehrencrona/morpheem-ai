import { apiCall } from '../api-call';
import { PostSchema } from './+server';

export async function storeWrittenSentence(params: PostSchema): Promise<void> {
	return apiCall(`/api/write`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
