import { apiCall } from '../../../api-call';

export async function fetchWordsByPrefix(prefix: string): Promise<string[]> {
	if (!prefix) {
		return Promise.resolve([]);
	}

	return apiCall(`/api/word/prefix/${encodeURIComponent(prefix)}`, {});
}
