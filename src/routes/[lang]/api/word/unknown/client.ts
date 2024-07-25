import { apiCall } from '../../api-call';
import type { PostSchema, UnknownWordResponse } from './+server';

export async function lookupUnknownWord(
	word: string,
	{ sentenceId, sentence }: { sentenceId?: number; sentence?: string } = {}
): Promise<UnknownWordResponse> {
	return apiCall(`/api/word/unknown`, {
		method: 'POST',
		body: JSON.stringify({ word, sentenceId, sentence } satisfies PostSchema)
	});
}
