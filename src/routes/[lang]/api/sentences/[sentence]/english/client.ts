import { apiCall } from '../../../api-call';

export interface Translation {
	english: string;
	transliteration?: string;
}

export async function fetchTranslation(sentenceId: number): Promise<Translation> {
	return apiCall(`/api/sentences/${sentenceId}/english`, {
		method: 'GET'
	});
}
