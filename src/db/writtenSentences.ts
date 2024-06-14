import { Language } from '../logic/types';
import { db } from './client';

export async function addWrittenSentence({
	sentence,
	entered,
	wordId,
	userId,
	language
}: {
	sentence: string;
	entered?: string;
	wordId?: number;
	userId: number;
	language: Language;
}) {
	await db
		.withSchema(language.schema)
		.insertInto('written_sentences')
		.values({
			sentence,
			entered,
			word_id: wordId,
			user_id: userId
		})
		.execute();
}

export async function getRecentWrittenSentences({
	userId,
	language
}: {
	userId: number;
	language: Language;
}) {
	return db
		.withSchema(language.schema)
		.selectFrom('written_sentences')
		.select(['sentence', 'word_id'])
		.where('user_id', '=', userId)
		.orderBy('time', 'desc')
		.limit(20)
		.execute();
}
