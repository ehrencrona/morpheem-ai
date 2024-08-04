import { Word } from '../db/types';

export function dedup<T>(array: T[]) {
	return [...new Set(array)];
}

export function dedupWords(words: Word[]) {
	const wordIds = new Set<number>();

	return words.filter((word) => {
		if (wordIds.has(word.id)) {
			return false;
		}

		wordIds.add(word.id);

		return true;
	});
}
