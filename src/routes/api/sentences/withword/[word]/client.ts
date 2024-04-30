import type { SentencesWithWords } from './+server';

export async function fetchSentencesWithWord(wordId: number): Promise<SentencesWithWords> {
	const res = await fetch(`/api/sentences/withword/${wordId}`);

	if (!res.ok) {
		throw new Error('Failed to load sentences');
	}

	return await res.json();
}

export async function addSentencesForWord(wordId: number): Promise<void> {
	const res = await fetch(`/api/sentences/withword/${wordId}`, {
		method: 'POST'
	});

	if (!res.ok) {
		throw new Error('Failed to add sentences');
	}
}
