import { z } from 'zod';
import { askForJson } from '../../ai/askForJson';
import { readFileSync, writeFileSync } from 'fs';
import { getUnits } from '../../db/units';
import { RUSSIAN, SWEDISH } from '../../constants';
import { getWords } from '../../db/words';

const language = RUSSIAN;

const words = await getWords({
	upToUnit: 3,
	language
});

async function askForUnit() {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content: `
      We are generating sentences for complete beginners for a ${language.name} course.
      Write thirty sentences (or multi-sentence texts), focusing on the words взять, голова and касса and
			limiting yourself strictly to the following vocabulary and using ONLY the nominative case singular and the accusative case singular,
      but displaying as much diversity as possible within these limitations.
      Try to have the sentences make logical sense. A text can have multiple sentences, e.g. a very short dialog.
      
      Vocabulary:
      
      ${shuffle(words.map(({ word }) => word)).join(', ')}
      
      Return JSON with first the sentence, then double check that the sentence only uses nominative singular and then double check that the sentence makes sense and is grammatically correct e.g.
      
      { "sentences": [
        { "sentence": "Я читаю книгу.", "onlyNominativeAndAccusative": true, "correctAndMakesSense": true },
        { "sentence": "Я читаю телевидение.", "onlyNominativeAndAccusative": true, "correctAndMakesSense": false },
        { "sentence": "Мой новый дом в городе.", "onlyNominativeAndAccusative": false, "correctAndMakesSense": true }
      ]}`
			}
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 1,
		schema: z.object({
			sentences: z.array(
				z.object({
					sentence: z.string(),
					onlyNominativeAndAccusative: z.boolean(),
					correctAndMakesSense: z.boolean()
				})
			)
		})
	});

	return res.sentences
		.filter((s) => s.onlyNominativeAndAccusative && s.correctAndMakesSense)
		.map((s) => s.sentence);
}

let sentences: string[] = [];

sentences = readFileSync(`./unit3.txt`, 'utf-8').split('\n');

for (let i = 0; i < 1; i++) {
	const newSentences = await askForUnit();

	console.log(newSentences.join('\n'));
	sentences = sentences.concat(newSentences);

	writeFileSync(`./unit3.txt`, sentences.join('\n'));
}

function shuffle(array: string[]) {
	let currentIndex = array.length,
		randomIndex;

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}
