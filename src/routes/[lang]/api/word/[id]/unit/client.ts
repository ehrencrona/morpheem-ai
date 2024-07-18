import { apiCall } from '../../../api-call';

export async function sendWordUnit(unit: number | null, wordId: number): Promise<void> {
	return apiCall(`/api/word/${wordId}/unit`, {
		method: 'PUT',
		body: JSON.stringify({ unit })
	});
}
