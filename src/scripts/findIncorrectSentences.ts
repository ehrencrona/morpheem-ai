import { toBatches } from '$lib/batch';
import { parallelize } from '$lib/parallelize';
import { findIncorrectSentences } from '../ai/findIncorrectSentences';
import { FRENCH, RUSSIAN } from '../constants';
import { deleteSentence, getSentenceIds, getSentencesByIds } from '../db/sentences';

const language = RUSSIAN;

async function main() {
	const idBatches = toBatches(
		(await getSentenceIds(FRENCH)).map(({ id }) => id),
		10
	);

	await parallelize(
		idBatches.map((idBatch) => async () => {
			const sentences = await getSentencesByIds(idBatch, language);

			const incorrectSentenceIds = await findIncorrectSentences(sentences, language);

			if (incorrectSentenceIds.length > 0) {
				for (const id of incorrectSentenceIds) {
					const sentence = sentences.find((s) => s.id === id);

					console.log(`${id}: ${sentence!.sentence}`);

					await deleteSentence(id, language);
				}
			}
		}),
		6
	);
}

main();
