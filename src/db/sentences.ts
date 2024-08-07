import { error } from '@sveltejs/kit';
import { Language, SentenceWord } from '../logic/types';
import { db } from './client';
import type { Clause, Sentence } from './types';

export function toSentence(row: {
	id: number;
	sentence: string;
	transliteration: string | null;
	english: string | null;
	unit: number | null;
}): Sentence {
	return {
		id: row.id,
		sentence: row.sentence,
		transliteration: row.transliteration || null,
		english: row.english || null,
		unit: row.unit || undefined
	};
}

export async function addSentence(
	sentenceString: string,
	{
		english,
		words,
		language,
		userId,
		level,
		unit
	}: {
		english: string | undefined;
		words: SentenceWord[];
		language: Language;
		userId?: number;
		level: number;
		unit?: number;
	}
): Promise<Sentence & { words: SentenceWord[] }> {
	const sentence = await db.transaction().execute(async (trx) => {
		const sentence = await trx
			.withSchema(language.schema)
			.insertInto('sentences')
			.values({ sentence: sentenceString, english, user_id: userId, level, unit })
			.returning(['id', 'sentence', 'english', 'transliteration'])
			.onConflict((oc) => oc.column('sentence').doNothing())
			.executeTakeFirst();

		if (!sentence) {
			console.warn(`Sentence "${sentenceString}" already exists`);

			const result = await trx
				.withSchema(language.schema)
				.selectFrom('sentences')
				.selectAll()
				.where('sentence', '=', sentenceString)
				.executeTakeFirstOrThrow();

			if (unit != undefined && (result.unit == null || result.unit > unit)) {
				await trx
					.withSchema(language.schema)
					.updateTable('sentences')
					.set({ unit })
					.where('id', '=', result.id)
					.execute();
			}

			return result;
		}

		const { id } = sentence;

		const wordSentences = words.map((word, index) => ({
			word_id: word.id,
			sentence_id: id,
			word_index: index
		}));

		await trx
			.withSchema(language.schema)
			.insertInto('word_sentences')
			.values(wordSentences)
			.execute();

		return sentence;
	});

	return { ...sentence, words };
}

export async function setSentenceUnit(unit: number | null, sentenceId: number, language: Language) {
	await db
		.withSchema(language.schema)
		.updateTable('sentences')
		.set({ unit })
		.where('id', '=', sentenceId)
		.execute();
}

export async function getSentences(language: Language, unit?: number): Promise<Sentence[]> {
	let select = db
		.withSchema(language.schema)
		.selectFrom('sentences')
		.select(['id', 'sentence', 'english', 'transliteration', 'unit'])
		.orderBy('id asc');

	if (unit) {
		select = select.where('unit', '=', unit);
	}

	return (await select.execute()).map(toSentence);
}

export async function getSentencesByText(sentences: string[], language: Language) {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('sentences')
			.select(['id', 'sentence', 'english', 'transliteration', 'unit'])
			.where('sentence', 'in', sentences)
			.execute()
	).map(toSentence);
}

export function getSentenceIds(language: Language) {
	return db.withSchema(language.schema).selectFrom('sentences').select(['id']).execute();
}

export async function getSentencesByIds(ids: number[], language: Language) {
	if (ids.length == 0) {
		return [];
	}

	return (
		await db
			.withSchema(language.schema)
			.selectFrom('sentences')
			.select(['id', 'sentence', 'english', 'transliteration', 'unit'])
			.where('id', 'in', ids)
			.execute()
	).map(toSentence);
}

export async function getSentence(id: number, language: Language) {
	const sentence = await db
		.withSchema(language.schema)
		.selectFrom('sentences')
		.select(['id', 'sentence', 'english', 'transliteration', 'unit'])
		.where('id', '=', id)
		.executeTakeFirst();

	if (!sentence) {
		return error(404, 'Sentence not found');
	}

	return toSentence(sentence);
}

export async function getSentencesWithWord(
	wordId: number,
	{
		language,
		userId,
		orderBy,
		limit,
		unit,
		upToUnit
	}: {
		language: Language;
		userId?: number;
		limit?: number;
		unit?: number;
		orderBy?: 'level asc';
		upToUnit?: number;
	}
): Promise<Sentence[]> {
	let select = db
		.withSchema(language.schema)
		.selectFrom('word_sentences')
		.innerJoin('sentences', 'sentence_id', 'id')
		.select(['id', 'sentence', 'english', 'transliteration', 'unit'])
		.where('word_id', '=', wordId);

	if (userId) {
		select = select.where((eb) => eb('user_id', 'is', null).or('user_id', '=', userId));
	} else {
		select = select.where('user_id', 'is', null);
	}

	if (unit) {
		select = select.where('unit', '=', unit);
	}

	if (upToUnit) {
		select = select.where('unit', '<=', upToUnit);
	}

	if (orderBy) {
		select = select.orderBy(orderBy);
	}

	if (limit) {
		select = select.limit(limit);
	}

	return (await select.execute()).map(toSentence);
}

export async function deleteSentence(sentenceId: number, language: Language) {
	await db
		.withSchema(language.schema)
		.deleteFrom('sentences')
		.where('id', '=', sentenceId)
		.execute();
}

export async function storeEnglish(
	{ english, transliteration }: { english: string; transliteration?: string },
	{ sentenceId, language }: { sentenceId: number; language: Language }
) {
	await db
		.withSchema(language.schema)
		.updateTable('sentences')
		.set({ english, transliteration })
		.where('id', '=', sentenceId)
		.execute();
}

export async function getClauses(
	sentenceId: number,
	language: Language
): Promise<Clause[] | undefined> {
	return ((
		await db
			.withSchema(language.schema)
			.selectFrom('sentences')
			.select(['clauses'])
			.where('id', '=', sentenceId)
			.executeTakeFirstOrThrow()
	).clauses || undefined) as Clause[] | undefined;
}

export async function storeClauses(
	clauses: Clause[] | undefined,
	sentenceId: number,
	language: Language
) {
	await db
		.withSchema(language.schema)
		.updateTable('sentences')
		.set({ clauses: clauses ? JSON.stringify(clauses) : null })
		.where('id', '=', sentenceId)
		.execute();
}
