import { apiCall } from '../../../api-call';

export async function fetchTranslation(sentenceId: number): Promise<string> {
	return apiCall(`/api/sentences/${sentenceId}/english`, {
		method: 'GET'
	});
}
