import { apiCall } from '../../api-call';

export async function markSentenceSeen(sentenceId: number): Promise<void> {
	return apiCall(`/api/sentences/${sentenceId}`, {
		method: 'POST'
	});
}
