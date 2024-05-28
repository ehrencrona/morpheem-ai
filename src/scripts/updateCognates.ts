import { findCognates } from '../ai/cognates';
import { POLISH } from '../constants';
import { db } from '../db/client';
import { getWords } from '../db/words';

const language = POLISH;

async function updateCognates() {
	const words = (await getWords('id asc', language)).filter(({ cognate }) => cognate === null);

	// take 30 words at a time, call findCognates, and set the "cognates" field to true or fals for each word
	for (let i = 0; i < words.length; i += 30) {
		const wordsToCheck = words.slice(i, i + 30).map(({ word }) => word);

		const cognates = await findCognates(wordsToCheck, POLISH);

		for (const word of wordsToCheck) {
			await db
				.updateTable('words')
				.set({ cognate: cognates.includes(word) })
				.where('word', '=', word)
				.execute();
		}
	}
}

async function doubleCheckCognates() {
	const words = (await getWords('id asc', language)).filter(({ cognate }) => cognate);

	// take 30 words at a time, call findCognates, and set the "cognates" field to true or fals for each word
	for (let i = 0; i < words.length; i += 30) {
		const wordsToCheck = words.slice(i, i + 30).map(({ word }) => word);

		const cognates = await findCognates(wordsToCheck, POLISH);

		for (const word of wordsToCheck) {
			if (!cognates.includes(word)) {
				console.log('Double checked:', word, 'is not a cognate');

				await db
					.updateTable('words')
					.set({ cognate: cognates.includes(word) })
					.where('word', '=', word)
					.execute();
			}
		}
	}
}

//updateCognates();
doubleCheckCognates();
