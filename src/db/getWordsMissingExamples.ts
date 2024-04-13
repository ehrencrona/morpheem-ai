import { sql } from 'kysely';
import { db } from './client';

export async function getWordsMissingExamples(n: number) {
	const words = await sql<{ id: number; word: string }>`SELECT w.id, w.word
FROM words w
LEFT JOIN (
    SELECT word_id, COUNT(sentence_id) AS sentence_count
    FROM word_sentences
    GROUP BY word_id
) AS ws ON w.id = ws.word_id
WHERE ws.sentence_count < ${n} OR ws.sentence_count IS NULL;`.execute(db);

	return words.rows.map((w) => w.word);
}
