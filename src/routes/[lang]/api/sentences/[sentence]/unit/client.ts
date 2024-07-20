import { apiCall } from '../../../api-call';

export async function sendSentenceUnit(unit: number | null, sentenceId: number): Promise<string> {
	return apiCall(`/api/sentences/${sentenceId}/unit`, {
		method: 'PUT',
		body: JSON.stringify({ unit })
	});
}
