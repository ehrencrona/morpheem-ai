import { parallelize } from '$lib/parallelize';
import { languages } from '../constants';
import { db } from '../db/client';
import { toWordStrings } from '../logic/toWordStrings';

for (const language of languages) {
	const wts = await db
		.withSchema(language.schema)
		.selectFrom('word_translations')
		.innerJoin('sentences', 'sentence_id', 'id')
		.innerJoin('word_sentences', (join) =>
			join
				.onRef('word_translations.sentence_id', '=', 'word_sentences.sentence_id')
				.onRef('word_translations.word_id', '=', 'word_sentences.word_id')
		)
		.select([
			'sentences.sentence',
			'word_translations.word_id',
			'word_translations.sentence_id',
			'word_sentences.word_index'
		])
		.where('inflected', 'is', null)
		.execute();

	let count = 0;

	await parallelize(
		wts.map((wt) => async () => {
			const word = toWordStrings(wt.sentence, language)[wt.word_index];

			if (word) {
				await db
					.withSchema(language.schema)
					.updateTable('word_translations')
					.set('inflected', word)
					.where('word_id', '=', wt.word_id)
					.where('sentence_id', '=', wt.sentence_id)
					.execute();
			} else {
				console.log(`No word found at index ${wt.word_index} in sentence ${wt.sentence_id}.`);
			}

			if (count++ % 100 == 0) {
				console.log(`${count} word translations updated.`);
			}
		}),
		20
	);

	console.log('done');
}
