import { apiCall } from '../../api-call';
import type { PostSchema, UnknownWordResponse } from './+server';

export async function lookupUnknownWord(
	word: string,
	sentenceId: number | undefined
): Promise<UnknownWordResponse> {
	return apiCall(`/api/word/unknown`, {
		method: 'POST',
		body: JSON.stringify({ word, sentenceId } satisfies PostSchema)
	});
}
