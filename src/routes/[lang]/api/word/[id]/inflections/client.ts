import { apiCall } from '../../../api-call';

export async function fetchInflections(wordId: number): Promise<string[]> {
	return apiCall(`/api/word/${wordId}/inflections`, {});
}
