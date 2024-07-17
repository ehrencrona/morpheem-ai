import { parallelize } from '$lib/parallelize';
import { classifyLemmas } from '../ai/classifyLemmas';
import { POLISH } from '../constants';
import { db } from '../db/client';
import { getWords } from '../db/words';

const language = POLISH;

async function updateWordTypes(run: 'dry' | 'real') {
	let words = await getWords({ orderBy: 'id asc', language });

	const slices: string[][] = [];

	for (let i = 0; i < words.length; i += 35) {
		slices.push(words.slice(i, i + 35).map(({ word }) => word));
	}

	await parallelize(
		slices.map((wordsToCheck) => async () => {
			const cognates = await classifyLemmas(wordsToCheck, { language, throwOnInvalid: false });

			for (const word of wordsToCheck) {
				const type = cognates.find(({ lemma }) => lemma === word)?.type || null;

				if (type == 'wrong' || type == 'inflection') {
					console.warn(
						`Invalid lemma: ${word} (${type}).` + (run == 'dry' ? '' : ` Deleting word...`)
					);

					if (run == 'real') {
						await db
							.withSchema(language.code)
							.deleteFrom('words')
							.where('word', '=', word)
							.execute();
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
		}),
		4,
		true
	);
}

updateWordTypes('real');
