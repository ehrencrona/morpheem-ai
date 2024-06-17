import { parallelize } from '$lib/parallelize';
import { FRENCH, POLISH, SPANISH } from '../constants';
import { db } from '../db/client';
import { getSentences } from '../db/sentences';
import { getWordsOfSentences } from '../db/words';
import { calculateSentenceLevel } from '../logic/addSentence';

const language = POLISH;

async function fixSentenceLevels() {
	const sentences = await getSentences(language);

	let count = 0,
		fixedCount = 0;

	const words = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	await parallelize(
		sentences.map((sentence, i) => async () => {
			const sentenceWords = words[i];

			const level = calculateSentenceLevel(sentenceWords);

			if (sentence.level != level) {
				fixedCount++;

				await db.transaction().execute(async (trx) => {
					await trx
						.withSchema(language.schema)
						.updateTable('sentences')
						.set('level', level)
						.where('id', '=', sentence.id)
						.execute();
				});
			}

			count++;

			if (count % 100 == 0) {
				console.log(`${count} sentences processed, ${fixedCount} fixed...`);
			}
		}),
		20
	);

	console.log(`Done. ${count} sentences processed, ${fixedCount} fixed.`);
}

fixSentenceLevels();
