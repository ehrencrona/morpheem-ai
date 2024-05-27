import type { PostSchema, UnknownWordResponse } from './+server';

export async function lookupUnknownWord(
	word: string,
	sentenceId: number | undefined
): Promise<UnknownWordResponse> {
	const res = await fetch(`/api/word/unknown`, {
		method: 'POST',
		body: JSON.stringify({ word, sentenceId } satisfies PostSchema)
	});

	if (!res.ok) {
		throw new Error('Failed to handle unknown word');
	}

	return await res.json();
}
