import { apiCall } from '../../api-call';

export async function fetchSimplified(text: string): Promise<string> {
	return apiCall(`/api/read/simplify`, {
		method: 'POST',
		body: JSON.stringify({ text })
	});
}
