import { z } from 'zod';
import { askForJson } from '../../ai/askForJson';
import { units } from './syllabus';
import { readFileSync, writeFileSync } from 'fs';

async function askForUnit() {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content: `
      We are generating sentences for complete beginners for a Polish course.
      Write sixty sentences (or multi-sentence texts), focusing on different inflections of verbs in the present and
			limiting yourself strictly to the following vocabulary and using ONLY the nominative case singular,
      but displaying as much diversity as possible within these limitations.
      Try to have the sentences make logical sense. A text can have multiple sentences, e.g. "Co to jest? To jest samochód." 
      
      Vocabulary:
      
      ${shuffle(units[0].words.concat(units[1].words)).join(', ')}
      
      Return JSON with first the sentence, then double check that the sentence only uses nominative singular and then double check that the sentence makes sense and is grammatically correct e.g.
      
      { "sentences": [
        { "sentence": "Ona śpi długo.", "onlyNominative": true, "makesSense": true },
        { "sentence": "On pomaga brat.", "onlyNominative": true, "makesSense": false },
        { "sentence": "Ona jest Ewą", "onlyNominative": false, "makesSense": true }
      ]}`
			}
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 1,
		schema: z.object({
			sentences: z.array(
				z.object({
					sentence: z.string(),
					onlyNominative: z.boolean(),
					makesSense: z.boolean()
				})
			)
		})
	});

	return res.sentences.filter((s) => s.onlyNominative && s.makesSense).map((s) => s.sentence);
}

let sentences: string[] = [];

sentences = readFileSync(`./unit2.txt`, 'utf-8').split('\n');

for (let i = 0; i < 3; i++) {
	const newSentences = await askForUnit();

	console.log(newSentences.join('\n'));
	sentences = sentences.concat(newSentences);

	writeFileSync(`./unit2.txt`, sentences.join('\n'));
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
