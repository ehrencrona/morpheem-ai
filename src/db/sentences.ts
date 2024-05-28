import { error } from '@sveltejs/kit';
import { Language } from '../logic/types';
import { db } from './client';
import type { Sentence } from './types';

export async function addSentence(
	sentenceString: string,
	{
		english,
		words,
		language
	}: {
		english: string | undefined;
		words: { id: number; word: string | null }[];
		language: Language;
	}
): Promise<Sentence | undefined> {
	const sentence = await db.transaction().execute(async (trx) => {
		const sentence = await trx
			.withSchema(language.schema)
			.insertInto('sentences')
			.values({ sentence: sentenceString, english })
			.returning(['id', 'sentence', 'english'])
			.onConflict((oc) => oc.column('sentence').doNothing())
			.executeTakeFirst();

		if (!sentence) {
			console.warn(`Sentence "${sentenceString}" already exists`);

			return undefined;
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

	return sentence;
}

export function getSentences(language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('sentences')
		.select(['id', 'sentence'])
		.orderBy('id asc')
		.execute();
}

export function getSentenceIds(language: Language) {
	return db.withSchema(language.schema).selectFrom('sentences').select(['id']).execute();
}

export async function getSentence(id: number, language: Language) {
	const sentence = await db
		.withSchema(language.schema)
		.selectFrom('sentences')
		.select(['id', 'sentence', 'english'])
		.where('id', '=', id)
		.executeTakeFirst();

	if (!sentence) {
		return error(404, 'Sentence not found');
	}

	return sentence;
}

export async function getSentencesWithWord(
	wordId: number,
	language: Language
): Promise<Sentence[]> {
	return db
		.withSchema(language.schema)
		.selectFrom('word_sentences')
		.innerJoin('sentences', 'sentence_id', 'id')
		.select(['id', 'sentence', 'english'])
		.where('word_id', '=', wordId)
		.execute();
}

export async function deleteSentence(sentenceId: number, language: Language) {
	await db
		.withSchema(language.schema)
		.deleteFrom('sentences')
		.where('id', '=', sentenceId)
		.execute();
}

export async function storeEnglish(english: string, sentenceId: number, language: Language) {
	await db
		.withSchema(language.schema)
		.updateTable('sentences')
		.set({ english })
		.where('id', '=', sentenceId)
		.execute();
}
