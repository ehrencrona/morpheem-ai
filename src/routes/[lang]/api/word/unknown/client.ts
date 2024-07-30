import { apiCall } from '../../api-call';
import type { PostSchema, UnknownWordResponse } from './+server';

let cache: Record<string, Promise<UnknownWordResponse>> = {};

export async function lookupUnknownWord(
	word: string,
	{ sentenceId, sentence }: { sentenceId?: number; sentence?: string } = {}
): Promise<UnknownWordResponse> {
	const key = `${word}-${sentenceId}-${sentence}`;

	let result: Promise<UnknownWordResponse> = cache[key];

	if (result == undefined) {
		result = cache[key] = apiCall(`/api/word/unknown`, {
			method: 'POST',
			body: JSON.stringify({ word, sentenceId, sentence } satisfies PostSchema)
		}).catch((e) => {
			delete cache[key];
			throw e;
		});
	}

	return result;
}
