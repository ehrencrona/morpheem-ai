import type { storeWrittenSentence } from '../../../../logic/storeWrittenSentence';
import { apiCall } from '../api-call';
import { PostSchema } from './+server';

export async function sendWrittenSentence(
	params: PostSchema
): ReturnType<typeof storeWrittenSentence> {
	return apiCall(`/api/write`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
