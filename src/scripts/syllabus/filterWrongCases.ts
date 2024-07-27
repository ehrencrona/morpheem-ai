import { toBatches } from '$lib/batch';
import { findCases } from '../../ai/findCases';
import { findTenses } from '../../ai/findTenses';
import { RUSSIAN, SPANISH } from '../../constants';
import { getSentences, setSentenceUnit } from '../../db/sentences';
import { getUnits } from '../../db/units';
import { writeFileSync, existsSync, readFileSync } from 'fs';

const language = RUSSIAN;

const units = await getUnits(language);

const unitByCase: Record<string, number> = {
	'accusative singular': 3,
	'genitive singular': 4,
	'locative singular': 5,
	'instrumental singular': 6,
	'nominative plural': 8,
	'genitive plural': 9,
	'dative singular': 13,
	'locative plural': 15,
	'instrumental plural': 16
};

const unitByTense: Record<string, number> = {
	past: 7,
	future: 11
};

const bySentence: Record<number, { cases: string[]; tenses: string[] }> = {};

if (existsSync('sentence-tenses.json')) {
	const data = readFileSync('sentence-tenses.json', 'utf-8');

	Object.assign(bySentence, JSON.parse(data));
}

for (const u of units.slice(0, units.length - 1)) {
	const unit = u.id;

	const sentences = await getSentences(language, unit);

	for (const batch of toBatches(sentences, 30) {
		const tenses = (await findTenses(batch, language)).tenses;
		const cases = (await findCases(batch, language)).cases;

		for (let s = 0; s < batch.length; s++) {
			let minUnit = unit;
			let reason = '';

			bySentence[batch[s].id] = { tenses: tenses[s].tenses, cases: cases[s].cases };

			for (const tense of tenses[s].tenses) {
				if (tense in unitByTense) {
					if (unitByTense[tense] > minUnit) {
						minUnit = unitByTense[tense];
						reason = tense;
					}
				}
			}

			for (const c of cases[s].cases) {
				if (c in unitByCase) {
					if (unitByCase[c] > minUnit) {
						minUnit = unitByCase[c];
						reason = c;
					}
				}
			}

			if (minUnit > unit) {
				console.log(`Moving sentence "${batch[s].sentence}" from unit ${unit} to ${minUnit}`);

				await setSentenceUnit(minUnit, batch[s].id, language);
			}
		}

		writeFileSync('sentence-tenses.json', JSON.stringify(bySentence, null, 2));
	}
}
