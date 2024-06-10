import { error } from '@sveltejs/kit';
import type { NotNull } from 'kysely';
import { Language, SentenceWord } from '../logic/types';
import { db } from './client';
import type * as DB from './types';

export async function addWord(
	lemma: string,
	{ language, isCognate }: { language: Language; isCognate?: boolean }
): Promise<DB.Word> {
	if (['an', 'the', 'they', 'this', 'big'].includes(lemma)) {
		throw new Error(`"${lemma}" is English`);
	}

	if (language.code == 'pl' && ['ta', 'wielu', 'można'].includes(lemma)) {
		throw new Error(`"${lemma}" is not the dictionary form`);
	}

	if (language.code == 'fr' && ['la', 'nos', 'les', 'ses', 'nos', 'une'].includes(lemma)) {
		throw new Error(`"${lemma}" is not the dictionary form`);
	}

	let result = await db
		.withSchema(language.schema)
		.insertInto('words')
		.values({
			word: lemma.toLowerCase(),
			cognate: isCognate,
			json: undefined
		})
		.returning(['id', 'word', 'level', 'cognate'])
		.onConflict((oc) => oc.column('word').doNothing())
		.executeTakeFirst();

	if (!result) {
		result = await db
			.withSchema(language.schema)
			.selectFrom('words')
			.select(['id', 'word', 'level', 'cognate'])
			.where('word', '=', lemma.toLowerCase())
			.executeTakeFirst();
	} else {
		console.log(
			`Added word "${lemma}" (${result.id})${isCognate != undefined ? (isCognate ? ' (cognate)' : ' (not cognate)') : ''}`
		);
	}

	return result!;
}

export async function getMultipleWordsByLemmas(lemmas: string[], language: Language) {
	if (lemmas.length == 0) {
		return [];
	}

	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'level', 'cognate'])
		.where('word', 'in', lemmas)
		.execute();
}

export async function getMultipleWordsByIds(wordIds: number[], language: Language) {
	if (wordIds.length == 0) {
		return [];
	}

	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'cognate', 'level'])
		.where('id', 'in', wordIds)
		.execute();
}

export async function getWords(orderBy: 'word asc' | 'id asc' | 'level asc', language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'cognate', 'level'])
		.orderBy(orderBy)
		.execute();
}

export async function getWordCount(language: Language) {
	const res = await db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(({ fn }) => [fn.count('id').as('count')])
		.execute();

	return res[0].count as number;
}

export async function getNonCognateWordIds(language: Language, maxLevel: number) {
	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word'])
		.where('cognate', '=', false)
		.where('level', '<=', maxLevel)
		.execute();
}

export async function getWordsBelowLevel(level: number, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'cognate', 'level'])
		.where('level', '<', level)
		.orderBy('level asc')
		.execute();
}

export async function getWordByLemma(lemma: string, language: Language): Promise<DB.Word> {
	const word = await db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'level', 'cognate'])
		.where('word', '=', lemma.toLowerCase())
		.executeTakeFirst();

	if (!word) {
		throw new Error(`Word with lemma ${lemma} not found`);
	}

	return word;
}

export async function getWordById(wordId: number, language: Language): Promise<DB.Word> {
	const word = await db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'level', 'cognate'])
		.where('id', '=', wordId)
		.executeTakeFirst();

	if (!word) {
		throw error(404, `Word with id ${wordId} not found`);
	}

	return word;
}

export async function getWordsByPrefix(
	prefix: string,
	{ language, limit }: { language: Language; limit: number }
) {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('word_lemma')
			.innerJoin('words', 'lemma_id', 'id')
			.select(['words.word'])
			.where('word_lemma.word', 'like', `${prefix.toLowerCase()}%`)
			.orderBy('word asc')
			.groupBy('words.word')
			.limit(limit)
			.execute()
	).map(({ word }) => word);
}

export async function updateLemma(wordId: number, lemma: string, language: Language) {
	await db
		.withSchema(language.schema)
		.updateTable('words')
		.set({ word: lemma })
		.where('id', '=', wordId)
		.execute();

	return getWordById(wordId, language);
}

export async function deleteWord(wordId: number, language: Language) {
	await db.withSchema(language.schema).deleteFrom('words').where('id', '=', wordId).execute();
}

export async function getWordsOfSentence(
	sentenceId: number,
	language: Language
): Promise<SentenceWord[]> {
	return db
		.withSchema(language.schema)
		.selectFrom('word_sentences')
		.innerJoin('words', 'word_id', 'id')
		.select(['word', 'word_index', 'id', 'level', 'cognate'])
		.where('sentence_id', '=', sentenceId)
		.orderBy('word_index')
		.$narrowType<{ word: NotNull }>()
		.execute();
}

export async function getWordsOfSentences(
	sentenceIds: number[],
	language: Language
): Promise<SentenceWord[][]> {
	if (sentenceIds.length == 0) {
		return [];
	}

	const rows = await db
		.withSchema(language.schema)
		.selectFrom('word_sentences')
		.innerJoin('words', 'word_id', 'id')
		.select(['word', 'word_index', 'id', 'level', 'cognate', 'sentence_id'])
		.where('sentence_id', 'in', sentenceIds)
		.orderBy(['sentence_id', 'word_index'])
		.$narrowType<{ word: NotNull }>()
		.execute();

	return sentenceIds.map((sentenceId) => rows.filter((row) => row.sentence_id == sentenceId));
}
