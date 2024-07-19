import { sql } from 'kysely';
import { db } from '../db/client';
import { getUnits } from '../db/units';
import { POLISH } from '../constants';
import { parallelize } from '$lib/parallelize';

const LEVELS_FOR_UNITS = 15;
const MAX_LEVEL = 100;

async function updateWordLevels() {
	const units = await getUnits(POLISH);

	const frequencies = await sql<{
		word: string;
		unit: number | null;
		word_id: number;
		frequency: number;
	}>`
    SELECT word_id, unit, word, COUNT(*) AS frequency
      FROM pl.word_sentences
      JOIN pl.words ON word_id = id
      GROUP BY word_id, unit, word
      ORDER BY frequency DESC`.execute(db);

	const count = frequencies.rows.length;

	await parallelize(
		frequencies.rows.map(({ word, unit, word_id }, i) => async () => {
			let level = Math.round(MAX_LEVEL * Math.sqrt(i++ / count));

			if (units.length) {
				if (unit != null) {
					level = Math.round((unit / units.length) * LEVELS_FOR_UNITS);
				} else {
					level = LEVELS_FOR_UNITS + Math.round(level * (1 - LEVELS_FOR_UNITS / MAX_LEVEL));
				}
			}

			console.log(`${word}\t${unit || '-'}\t${level}`);

			await db
				.withSchema('pl')
				.updateTable('words')
				.set({ level })
				.where('id', '=', word_id)
				.execute();
		}),
		10
	);

	process.exit(0);
}

updateWordLevels();
