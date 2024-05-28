import { apiCall } from '../../api-call';
import type { FeedbackResponse, PostSchema } from './+server';

export async function fetchWritingFeedback(params: PostSchema): Promise<FeedbackResponse> {
	return apiCall(`/api/write/feedback`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
