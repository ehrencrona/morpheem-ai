import { apiCall } from '../api-call';

export async function sendSettings(settings: { unit: number | null }): Promise<void> {
	return apiCall(`/api/settings`, {
		method: 'PUT',
		body: JSON.stringify(settings)
	});
}
