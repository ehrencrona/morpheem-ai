import { addSentencesForWord as addSentencesForWordLogic } from '../../../../../../logic/addSentencesForWord';
import { CandidateSentenceWithWords } from '../../../../../../logic/types';
import { apiCall } from '../../../api-call';

export async function fetchSentencesWithWord(
	wordId: number
): Promise<CandidateSentenceWithWords[]> {
	return apiCall(`/api/sentences/withword/${wordId}`, {});
}

export async function addSentencesForWord(
	wordId: number
): ReturnType<typeof addSentencesForWordLogic> {
	return apiCall(`/api/sentences/withword/${wordId}`, {
		method: 'POST'
	});
}
