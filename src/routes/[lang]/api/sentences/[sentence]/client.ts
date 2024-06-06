import { CandidateSentenceWithWords } from '../../../../../logic/types';
import { apiCall } from '../../api-call';

export async function markSentenceSeen(sentenceId: number): Promise<void> {
	return apiCall(`/api/sentences/${sentenceId}`, {
		method: 'POST'
	});
}

export async function fetchCandidateSentence(
	sentenceId: number
): Promise<CandidateSentenceWithWords & { english: string }> {
	return apiCall(`/api/sentences/${sentenceId}`, {
		method: 'GET'
	});
}
