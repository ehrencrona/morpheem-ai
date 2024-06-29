import { parallelize } from '$lib/parallelize';
import { findIncorrectSentences } from '../ai/findIncorrectSentences';
import { FRENCH, RUSSIAN } from '../constants';
import { deleteSentence, getSentenceIds, getSentencesByIds } from '../db/sentences';

const language = RUSSIAN;

async function main() {
	const idBatches = batch(
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

function batch<T>(arr: T[], size: number): T[][] {
	const result = [];

	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}

	return result;
}

main();
