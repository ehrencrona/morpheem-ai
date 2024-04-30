import { error } from '@sveltejs/kit';
import { db } from './client';
import type * as DB from './types';
import type { NotNull } from 'kysely';

export async function addWord(lemma: string, english: string, encounteredForm: string | undefined) {
	console.log(`Adding word ${lemma}...`);

	const result = await db
		.insertInto('words')
		.values({
			word: lemma,
			english,
			json: encounteredForm ? { forms: [encounteredForm] } : undefined
		})
		.returning(['id', 'word'])
		.onConflict((oc) => oc.column('word').doNothing())
		.executeTakeFirst();

	if (!result) {
		return db
			.selectFrom('words')
			.select(['id', 'word'])
			.where('word', '=', lemma)
			.executeTakeFirst();
	}

	return result;
}

export async function getMultipleWords(lemmas: string[]) {
	return db.selectFrom('words').select(['id', 'word']).where('word', 'in', lemmas).execute();
}

export async function getWords() {
	return db.selectFrom('words').select(['id', 'word', 'english']).orderBy('word asc').execute();
}

export async function getWordById(wordId: number) {
	const word = await db
		.selectFrom('words')
		.select(['id', 'word', 'english'])
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
		.select(['word', 'word_index', 'id', 'english'])
		.where('sentence_id', '=', sentenceId)
		.orderBy('word_index')
		.$narrowType<{ word: NotNull }>()
		.execute();
}
