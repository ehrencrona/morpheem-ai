import { apiCall } from '../../../api-call';

export async function fetchHint(sentenceId: number): Promise<string> {
	return apiCall(`/api/sentences/${sentenceId}/hint`, {
		method: 'GET'
	});
}
