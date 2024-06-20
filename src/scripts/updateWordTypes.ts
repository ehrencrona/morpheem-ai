import { classifyLemmas } from '../ai/classifyLemmas';
import { KOREAN, POLISH } from '../constants';
import { db } from '../db/client';
import { getWords } from '../db/words';

const language = KOREAN;

async function updateWordTypes(run: 'dry' | 'real') {
	const words = await getWords('id asc', language);

	for (let i = 0; i < words.length; i += 30) {
		const wordsToCheck = words.slice(i, i + 30).map(({ word }) => word);

		const cognates = await classifyLemmas(wordsToCheck, { language, throwOnInvalid: false });

		for (const word of wordsToCheck) {
			const type = cognates.find(({ lemma }) => lemma === word)?.type || null;

			if (type == 'wrong' || type == 'inflection') {
				console.warn(
					`Invalid lemma: ${word} (${type}).` + (run == 'dry' ? '' : ` Deleting word...`)
				);

				if (run == 'real') {
					await db.withSchema(language.code).deleteFrom('words').where('word', '=', word).execute();
				}
			} else {
				if (type == 'name' || type == 'particle' || type == 'cognate') {
					console.log(`Updating word: ${word} (${type})`);
				}

				if (run == 'real') {
					await db
						.withSchema(language.code)
						.updateTable('words')
						.set({ type })
						.where('word', '=', word)
						.execute();
				}
			}
		}
	}
}

updateWordTypes('dry');
