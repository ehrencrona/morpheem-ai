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
	const words = await sql<{
		id: number;
		word: string;
		level: number;
		cognate: boolean | null;
		frequency: number;
	}>`SELECT w.id, w.word, w.level, w.cognate COUNT(ws.word_id) AS frequency
    FROM ${language.schema}.word_sentences ws
    JOIN words w ON ws.word_id = w.id
    GROUP BY w.id, w.word
    HAVING COUNT(ws.word_id) < ${minSentenceCount}
    ORDER BY frequency DESC
    LIMIT ${limit};`.execute(db);

	return words.rows;
}
