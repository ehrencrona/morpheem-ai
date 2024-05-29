import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';

export function dedupUnknown(unknowns: UnknownWordResponse[]) {
	const seen = new Set<string>();
	return unknowns.filter((unknown) => {
		if (seen.has(unknown.word)) {
			return false;
		}
		seen.add(unknown.word);
		return true;
	});
}
