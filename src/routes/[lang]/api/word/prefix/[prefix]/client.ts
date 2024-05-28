import { apiCall } from '../../../api-call';

export async function fetchWordsByPrefix(prefix: string): Promise<string[]> {
	return apiCall(`/api/word/prefix/${encodeURIComponent(prefix)}`, {});
}
