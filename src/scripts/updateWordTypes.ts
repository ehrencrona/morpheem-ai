import { parallelize } from '$lib/parallelize';
import { classifyLemmas } from '../ai/classifyLemmas';
import { KOREAN, SPANISH } from '../constants';
import { db } from '../db/client';
import { getWords } from '../db/words';
import * as DB from '../db/types';

const language = SPANISH;

async function updateWordTypes(run: 'dry' | 'real') {
	const words = await getWords('id asc', language);

	const slices: string[][] = [];

	for (let i = 0; i < words.length; i += 25) {
		slices.push(words.slice(i, i + 25).map(({ word }) => word));
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
