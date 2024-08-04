import { dedup, dedupWords } from '$lib/dedup';
import { filterUndefineds } from '$lib/filterUndefineds';
import { Language } from '../logic/types';
import { db } from './client';
import { Word } from './types';
import { toWord } from './words';

/** undefined means "not set". empty array means set but empty. */
export async function getWordRelations(
	wordId: number,
	language: Language,
	includeReverse = false
): Promise<Word[] | undefined> {
	const [words, reverseWords] = await Promise.all([
		db
			.withSchema(language.code)
			.selectFrom('word_relations')
			// preserve null values
			.leftJoin('words', 'related_word_id', 'id')
			.select(['word', 'id', 'level', 'type', 'unit'])
			.where('word_id', '=', wordId)
			.execute()
			.then((res) =>
				res.map(({ id, level, word, type, unit }) =>
					id != null && level != null && word != null
						? toWord({ id, level, word, type, unit })
						: undefined
				)
			),
		includeReverse
			? db
					.withSchema(language.code)
					.selectFrom('word_relations')
					.innerJoin('words', 'word_id', 'id')
					.select(['word', 'id', 'level', 'type', 'unit'])
					.where('related_word_id', '=', wordId)
					.execute()
					.then((res) =>
						res.map(({ id, level, word, type, unit }) =>
							id != null && level != null && word != null
								? toWord({ id, level, word, type, unit })
								: undefined
						)
					)
			: undefined
	]);

	let realWords = filterUndefineds(words);

	if (includeReverse && reverseWords) {
		realWords = dedupWords([...realWords, ...filterUndefineds(reverseWords)]);
	}

	if (realWords.length == 0) {
		// a single null value indicates that the word has no relations
		if (words.length > 0) {
			return [];
		} else {
			return undefined;
		}
	} else {
		return realWords;
	}
}

export async function addWordRelations(
	fromWordId: number,
	toWordIds: number[],
	language: Language
): Promise<void> {
	toWordIds = dedup(toWordIds.filter((id) => id !== fromWordId));

	if (toWordIds.length === 0) {
		await db
			.withSchema(language.code)
			.deleteFrom('word_relations')
			.where('word_id', '=', fromWordId)
			.execute();

		await db
			.withSchema(language.code)
			.insertInto('word_relations')
			.values([{ word_id: fromWordId, related_word_id: null }])
			.execute();
	} else {
		await db
			.withSchema(language.code)
			.insertInto('word_relations')
			.values(toWordIds.map((toWordId) => ({ word_id: fromWordId, related_word_id: toWordId })))
			.onConflict((oc) => oc.columns(['word_id', 'related_word_id']).doNothing())
			.execute();
	}
}

const cache = new Map<Language, { promise: Promise<Map<number, Word[]>>; time: number }>();

const MINUTE_IN_MS = 60 * 1000;

export async function getAllRelated(language: Language): Promise<Map<number, Word[]>> {
	let value = cache.get(language);

	if (!value || value.time + 60 * MINUTE_IN_MS < Date.now()) {
		const promise = uncachedGetAllRelated(language);

		value = { promise, time: Date.now() };

		cache.set(language, value);
	}

	return value.promise;
}

async function uncachedGetAllRelated(language: Language): Promise<Map<number, Word[]>> {
	const relations = await db
		.withSchema(language.code)
		.selectFrom('word_relations')
		.leftJoin('words', 'related_word_id', 'id')
		.select(['word', 'id', 'level', 'type', 'unit', 'word_id'])
		.execute();

	const map = new Map<number, Word[]>();

	for (const { id, level, word: wordString, type, unit, word_id: fromWordId } of relations) {
		if (id != null && level != null && wordString != null && fromWordId != null) {
			const word = toWord({
				id,
				level,
				word: wordString,
				type,
				unit
			});

			if (map.has(fromWordId)) {
				map.get(fromWordId)!.push(word);
			} else {
				map.set(fromWordId, [word]);
			}
		}
	}

	return map;
}
