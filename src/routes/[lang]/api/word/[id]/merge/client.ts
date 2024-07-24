import { apiCall } from '../../../api-call';

export async function storeMergeWordWith(
	wordId: number,
	mergeWith: string
): Promise<{ toWordId: number }> {
	return apiCall(`/api/word/${wordId}/merge`, {
		method: 'POST',
		body: JSON.stringify({ mergeWith })
	});
}
