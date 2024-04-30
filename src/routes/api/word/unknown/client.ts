import type { UnknownWordResponse } from './+server';

export async function lookupUnknownWord(
	word: string,
	sentenceId: number
): Promise<UnknownWordResponse> {
	const res = await fetch(`/api/word/unknown`, {
		method: 'POST',
		body: JSON.stringify({ word, sentenceId })
	});

	if (!res.ok) {
		throw new Error('Failed to handle unknown word');
	}

	return await res.json();
}
