import { apiCall } from '../../../api/api-call';

export async function sendWordUnit(unit: number | null, sentenceId: number): Promise<void> {
	return apiCall(`/api/sentences/${sentenceId}/unit`, {
		method: 'PUT',
		body: JSON.stringify({ unit })
	});
}
