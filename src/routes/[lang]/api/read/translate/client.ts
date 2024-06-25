import { apiCall } from '../../api-call';

export async function fetchTranslation(
	text: string
): Promise<{ translation: string; transliteration?: string }> {
	return apiCall(`/api/read/translate`, {
		method: 'POST',
		body: JSON.stringify({ text })
	});
}
