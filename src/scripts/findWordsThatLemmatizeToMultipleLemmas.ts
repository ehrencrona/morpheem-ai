import { sql } from 'kysely';
import { FRENCH } from '../constants';
import { db } from '../db/client';
import { getLemmasOfWord } from '../db/lemmas';

const language = FRENCH;

async function findWordsThatLemmatizeToMultipleLemmas() {
	const words = await db
		.withSchema(language.schema)
		.selectFrom('word_lemma')
		.innerJoin('words', 'word_lemma.lemma_id', 'words.id')
		.select(['word_lemma.word', sql`COUNT(*)`.as('frequency')])
		.groupBy('word_lemma.word')
		.having(sql`COUNT(*)`, '>', 1)
		.execute();

	for (const { word, frequency } of words) {
		console.log(`${word}: ${(await getLemmasOfWord(word, language)).map(({ word }) => word)} `);
	}
}

findWordsThatLemmatizeToMultipleLemmas();
