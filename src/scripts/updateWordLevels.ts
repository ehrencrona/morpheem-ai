import { sql } from 'kysely';
import { db } from '../db/client';

async function updateWordLevels() {
	const frequencies = await sql<{
		word: string;
		word_id: number;
		frequency: number;
	}>`
    SELECT word_id, word, COUNT(*) AS frequency
      FROM pl.word_sentences
      JOIN pl.words ON word_id = id
      GROUP BY word_id, word
      ORDER BY frequency DESC`.execute(db);

	const count = frequencies.rows.length;

	let i = 0;

	for (const { word, word_id } of frequencies.rows) {
		const level = Math.round(100 * Math.sqrt(i++ / count));

		console.log(`${word}\t${level}`);

		await db
			.withSchema('pl')
			.updateTable('words')
			.set({ level })
			.where('id', '=', word_id)
			.execute();
	}

	process.exit(0);
}

updateWordLevels();
