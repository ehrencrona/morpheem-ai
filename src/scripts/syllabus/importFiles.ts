import { toBatches } from '$lib/batch';
import { unzip, zip } from '$lib/zip';
import { existsSync, readFileSync } from 'fs';
import { shuffle } from 'simple-statistics';
import { POLISH, RUSSIAN } from '../../constants';
import { getUnits } from '../../db/units';
import { getWords } from '../../db/words';
import { addSentences } from '../../logic/addSentence';
import { lemmatizeSentences } from '../../logic/lemmatize';
import { findInvalidSentences } from '../../ai/findInvalidSentences';

let allVocab = new Set<string>();
let previousSentences = new Set<string>();

const language = RUSSIAN;

const units = await getUnits(language);

for (let unitNumber = 1; unitNumber < units.length + 1; unitNumber++) {
	console.log(`\n\n\nProcessing unit ${unitNumber}...`);

	const file = `./unit${unitNumber}.txt`;

	if (!existsSync(file)) {
		continue;
	}

	let allSentences = shuffle(dedup(readFileSync(file, 'utf-8').split('\n')));

	allVocab = new Set((await getWords({ language, upToUnit: unitNumber })).map(({ word }) => word));

	for (let batch of toBatches(allSentences, 30)) {
		batch = batch.filter((sentence) => !previousSentences.has(sentence));

		const invalid = await findInvalidSentences(batch, language);

		batch = batch.filter((s) => !invalid.includes(s));

		let lemmas = await lemmatizeSentences(batch, { language, onError: 'returnempty' });

		[batch, lemmas] = unzip(
			zip(batch, lemmas).filter(([sentence, lemmas]) => {
				if (lemmas.length == 0) {
					console.error(`Could not parse sentence "${sentence}"`);

					return false;
				}

				const unknownWords = lemmas.filter((lemma) => !allVocab.has(lemma));

				if (unknownWords.length > 1) {
					console.error(
						`Sentence "${sentence}" contains too many words not in the vocabulary: ${unknownWords.join(', ')}`
					);

					return false;
				} else if (unknownWords.length == 1) {
					console.error(
						`Sentence "${sentence}" contains word not in the vocabulary: ${unknownWords[0]}`
					);
				}

				return true;
			})
		);

		await addSentences(batch, undefined, lemmas, {
			language,
			unit: unitNumber
		});

		previousSentences = new Set([...previousSentences, ...batch]);
	}
}

function dedup(arr: string[]) {
	return [...new Set(arr)];
}
