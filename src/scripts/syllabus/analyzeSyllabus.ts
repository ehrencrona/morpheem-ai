import { readFromFile, units } from './syllabus';
import { readFileSync, writeFileSync, existsSync } from 'fs';

let allSentences = readFromFile();

let allVocab = new Set<string>();

for (let i = 0; i < units.length; i++) {
	let unit = units[i];

	for (let word of unit.words) {
		allVocab.add(word);
	}

	const higherUnits = units.slice(i + 1).map((unit) => unit.abbr);

	const unitSentences = allSentences.filter(
		(sentence) => !sentence.units.some((unit) => higherUnits.includes(unit))
	);

	allSentences = allSentences.filter((sentence) => !unitSentences.includes(sentence));

	console.log(`UNIT ${unit.abbr} (${unit.name}): ${unitSentences.length} sentences`);

	const file = `./unit${i + 1}.txt`;

	{
		let fileSentences: string[] = [];

		if (existsSync(file)) {
			fileSentences = readFileSync(file, 'utf-8').split('\n');
		}

		fileSentences = fileSentences.concat(unitSentences.map((sentence) => sentence.sentence));

		writeFileSync(file, fileSentences.join('\n'));
	}
}
