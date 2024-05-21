import { addSentencesForWord as addSentencesForWordLogic } from '../../../../../logic/addSentencesForWord';
import { CandidateSentenceWithWords } from '../../../../../logic/types';

export async function fetchSentencesWithWord(
	wordId: number
): Promise<CandidateSentenceWithWords[]> {
	const res = await fetch(`/api/sentences/withword/${wordId}`);

	if (!res.ok) {
		throw new Error('Failed to load sentences');
	}

	return await res.json();
}

export async function addSentencesForWord(
	wordId: number
): ReturnType<typeof addSentencesForWordLogic> {
	const res = await fetch(`/api/sentences/withword/${wordId}`, {
		method: 'POST'
	});

	if (!res.ok) {
		throw new Error('Failed to add sentences');
	}

	return await res.json();
}
