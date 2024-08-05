import { toBatches } from '$lib/batch';
import { findRelatedWordsForMany } from '../ai/relatedWords';
import { POLISH, SPANISH, SWEDISH } from '../constants';
import { db } from '../db/client';
import { addWordRelations } from '../db/wordRelations';
import { getMultipleWordsByLemmas } from '../db/words';

const language = SPANISH;

const words = await db
	.withSchema(language.schema)
	.selectFrom('words')
	.select(['words.id', 'words.word'])
	.where('words.level', '<', 100)
	.innerJoin('word_translations', 'id', 'word_id')
	.select(['id'])
	.groupBy('words.id')
	.execute();

for (const batch of toBatches(words, 20)) {
	const related = await findRelatedWordsForMany(
		batch.map((w) => w.word),
		language
	);

	for (const { word: wordString, sameRoot: relatedWordStrings } of related) {
		const word = batch.find((w) => w.word === wordString);

		if (word) {
			const related = await getMultipleWordsByLemmas(relatedWordStrings, language);

			console.log(
				`Related to ${wordString}: ${
					relatedWordStrings.join(', ') || 'none'
				}. Known: ${related.map(({ word, id }) => `${word} (${id})`).join(', ')}`
			);

			await addWordRelations(
				word.id,
				related.map((word) => word.id),
				language
			);
		} else {
			console.error(`Word not found in response: ${wordString}`);
		}
	}
}
