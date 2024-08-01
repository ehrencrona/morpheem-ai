import { QuicklyTranslatedWord } from '../../../../../logic/translate';
import { apiCall } from '../../api-call';
import type { PostSchema, UnknownWordResponse } from './+server';

let cache: Record<string, Promise<UnknownWordResponse>> = {};

export async function lookupUnknownWord(
	word: string,
	{
		sentenceId,
		sentence,
		onQuickAndDirtyTranslation
	}: {
		sentenceId?: number;
		sentence?: string;
		onQuickAndDirtyTranslation?: (unknown: UnknownWordResponse) => void;
	} = {}
): Promise<UnknownWordResponse> {
	const key = `${word}-${sentenceId}-${sentence}`;

	let result = cache[key];

	if (result == undefined) {
		result = cache[key] = uncachedLookupUnknownWord(word, {
			sentenceId,
			sentence,
			onQuickAndDirtyTranslation
		});
	}

	return result;
}

export async function uncachedLookupUnknownWord(
	word: string,
	{
		sentenceId,
		sentence,
		onQuickAndDirtyTranslation
	}: {
		sentenceId?: number;
		sentence?: string;
		onQuickAndDirtyTranslation?: (unknown: UnknownWordResponse) => void;
	} = {}
): Promise<UnknownWordResponse> {
	let result: UnknownWordResponse & QuicklyTranslatedWord = onQuickAndDirtyTranslation
		? await apiCall(`/api/word/unknown?quick=true`, {
				method: 'POST',
				body: JSON.stringify({ word, sentenceId, sentence } satisfies PostSchema)
			})
		: undefined;

	if (result?.isQuickAndDirty && onQuickAndDirtyTranslation) {
		console.log(`q'n'd definition of ${word}: ${result.english}`);

		onQuickAndDirtyTranslation(result);
	}

	if (!result || result.isQuickAndDirty) {
		result = await apiCall(`/api/word/unknown`, {
			method: 'POST',
			body: JSON.stringify({ word, sentenceId, sentence } satisfies PostSchema)
		});

		console.log(`final definition of ${word}: ${result.english}`);
	}

	return result;
}
