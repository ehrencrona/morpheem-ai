import { apiCall } from '../../api-call';

export async function sendReadText(text: string): Promise<void> {
	return apiCall(`/api/read/text`, {
		method: 'POST',
		body: JSON.stringify({ text })
	});
}
