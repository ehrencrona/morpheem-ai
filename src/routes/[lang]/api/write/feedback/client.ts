import { apiCall } from '../../api-call';
import type { WritingFeedbackResponse, PostSchema } from './+server';

export async function fetchWritingFeedback(params: PostSchema): Promise<WritingFeedbackResponse> {
	return apiCall(`/api/write/feedback`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
