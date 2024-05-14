import { error } from '@sveltejs/kit';
import { db } from './client';
import type * as DB from './types';
import type { NotNull } from 'kysely';

export async function addWord(lemma: string, isCognate?: boolean) {
	if (lemma == 'the') {
		throw new Error('"the" is English');
	}

	let result = await db
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

export async function getMultipleWordsByLemmas(lemmas: string[]) {
	return db
		.selectFrom('words')
		.select(['id', 'word', 'level', 'cognate'])
		.where('word', 'in', lemmas)
		.execute();
}

export async function getMultipleWordsByIds(wordIds: number[]) {
	return db.selectFrom('words').select(['id', 'word']).where('id', 'in', wordIds).execute();
}

export async function getWords(orderBy: 'word asc' | 'id asc') {
	return db
		.selectFrom('words')
		.select(['id', 'word', 'cognate', 'level'])
		.orderBy(orderBy)
		.execute();
}

export async function getWordsBelowLevel(level: number) {
	return db
		.selectFrom('words')
		.select(['id', 'word', 'cognate', 'level'])
		.where('level', '<', level)
		.orderBy('level asc')
		.execute();
}

export async function getWordByLemma(lemma: string): Promise<DB.Word> {
	const word = await db
		.selectFrom('words')
		.select(['id', 'word', 'level', 'cognate'])
		.where('word', '=', lemma.toLowerCase())
		.executeTakeFirst();

	if (!word) {
		throw new Error(`Word with lemma ${lemma} not found`);
	}

	return word;
}

export async function getWordById(wordId: number): Promise<DB.Word> {
	const word = await db
		.selectFrom('words')
		.select(['id', 'word', 'level', 'cognate'])
		.where('id', '=', wordId)
		.executeTakeFirst();

	if (!word) {
		throw error(404, `Word with id ${wordId} not found`);
	}

	return word;
}

export async function updateLemma(wordId: number, lemma: string) {
	await db.updateTable('words').set({ word: lemma }).where('id', '=', wordId).execute();

	return getWordById(wordId);
}

export async function deleteWord(wordId: number) {
	await db.deleteFrom('words').where('id', '=', wordId).execute();
}

export async function getWordsOfSentence(sentenceId: number): Promise<DB.Word[]> {
	return db
		.selectFrom('word_sentences')
		.innerJoin('words', 'word_id', 'id')
		.select(['word', 'word_index', 'id', 'level', 'cognate'])
		.where('sentence_id', '=', sentenceId)
		.orderBy('word_index')
		.$narrowType<{ word: NotNull }>()
		.execute();
}
