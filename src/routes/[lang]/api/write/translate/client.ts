import { apiCall } from '../../api-call';
import type { PostSchema, TranslationFeedbackResponse } from './+server';

export async function fetchTranslationFeedback(
	params: PostSchema
): Promise<TranslationFeedbackResponse> {
	return apiCall(`/api/write/translate`, {
		method: 'POST',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
