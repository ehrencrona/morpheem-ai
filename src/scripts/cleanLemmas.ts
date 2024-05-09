import { sql } from 'kysely';
import { db } from '../db/client';

async function removeImplausibleLemmas() {
	const all = await db
		.selectFrom('word_lemma')
		.innerJoin('words', 'word_lemma.lemma_id', 'words.id')
		.select(['word_lemma.word as word_string', 'words.word', 'words.id'])
		.execute();

	console.log(all.map(({ word_string, word }) => `${word_string} -> ${word}`).join('\n'));

	// for (const { word_string, word, id } of all) {
	// 	if (word_string[0] !== word[0]) {
	// 		console.log(`Deleting ${word_string} -> ${word} (${id})`);

	// 		await db
	// 			.deleteFrom('word_lemma')
	// 			.where('lemma_id', '=', id)
	// 			.where('word', '=', word_string)
	// 			.execute();
	// 	}
	// }
}

async function findWordsThatLemmatizeToMultipleLemmas() {
	// find entries in word_lemma where word occurs more than once
	const words = await sql<{
		id: number;
		word: string;
	}>`SELECT id, word FROM words WHERE id IN (SELECT lemma_id FROM word_lemma GROUP BY word, HAVING COUNT(*) > 1);`.execute(
		db
	);

	console.log(words.rows.map(({ word }) => word).join('\n'));
}

findWordsThatLemmatizeToMultipleLemmas();
//removeImplausibleLemmas();
