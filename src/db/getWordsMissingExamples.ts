import { sql } from 'kysely';
import { Language } from '../logic/types';
import { db } from './client';
import * as DB from './types';

export async function getWordsMissingExamples({
	minSentenceCount = 10,
	limit = 10,
	language
}: {
	minSentenceCount?: number;
	limit?: number;
	language: Language;
}): Promise<DB.Word[]> {
	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.leftJoin('word_sentences', 'word_sentences.word_id', 'words.id')
		.select(['words.id', 'word', 'level', 'cognate', sql`COUNT(*)`.as('frequency')])
		.groupBy(['words.id', 'word'])
		.having(sql`COUNT(word_sentences.sentence_id)`, '<', minSentenceCount)
		.orderBy('frequency', 'desc')
		.limit(limit)
		.execute();
}
