import { error } from '@sveltejs/kit';
import { db } from './client';
import type * as DB from './types';
import type { NotNull } from 'kysely';

export async function addWord(lemma: string) {
	let result = await db
		.insertInto('words')
		.values({
			word: lemma.toLowerCase(),
			json: undefined
		})
		.returning(['id', 'word'])
		.onConflict((oc) => oc.column('word').doNothing())
		.executeTakeFirst();

	if (!result) {
		result = await db
			.selectFrom('words')
			.select(['id', 'word'])
			.where('word', '=', lemma.toLowerCase())
			.executeTakeFirst();
	}

	return result!;
}

export async function getMultipleWords(lemmas: string[]) {
	return db.selectFrom('words').select(['id', 'word']).where('word', 'in', lemmas).execute();
}

export async function getWords() {
	return db.selectFrom('words').select(['id', 'word']).orderBy('word asc').execute();
}

export async function getWordByLemma(lemma: string) {
	const word = await db
		.selectFrom('words')
		.select(['id', 'word'])
		.where('word', '=', lemma.toLowerCase())
		.executeTakeFirst();

	if (!word) {
		throw error(404, `Word with lemma ${lemma} not found`);
	}

	return word;
}

export async function getWordById(wordId: number): Promise<DB.Word> {
	const word = await db
		.selectFrom('words')
		.select(['id', 'word'])
		.where('id', '=', wordId)
		.executeTakeFirst();

	if (!word) {
		throw error(404, `Word with id ${wordId} not found`);
	}

	return word;
}

export async function getWordsOfSentence(sentenceId: number): Promise<DB.Word[]> {
	return db
		.selectFrom('word_sentences')
		.innerJoin('words', 'word_id', 'id')
		.select(['word', 'word_index', 'id'])
		.where('sentence_id', '=', sentenceId)
		.orderBy('word_index')
		.$narrowType<{ word: NotNull }>()
		.execute();
}
