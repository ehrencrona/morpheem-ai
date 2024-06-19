import { apiCall } from '../../../api-call';

export async function fetchInflections(wordIdOrWord: number | string): Promise<string[]> {
	return apiCall(`/api/word/${wordIdOrWord}/inflections`, {});
}
