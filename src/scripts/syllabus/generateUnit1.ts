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
      Write sixty sentences (or multi-sentence texts), limiting yourself strictly to the following vocabulary and using ONLY the nominative case,
      but displaying as much diversity as possible within these limitations. 
      For example, use as subject that is a name (Ewa, Marek), a pronoun or another noun (mama, kot). Do not always use the same word order.
      Try to have the sentences make logical sense. A text can have multiple sentences, e.g. "Ewa? Ona tu jest." 
      
      Vocabulary:
      
      ${units[0].words.join(', ')}
      
      Return JSON with first the sentence, then double check that the sentence only uses nominative singular and then double check that the sentence makes sense and is grammatically correct e.g.
      
      { "sentences": [
        { "sentence": "To polski człowiek", "onlyNominative": true, "makesSense": true },
        { "sentence": "Marek to on", "onlyNominative": true, "makesSense": true },
        { "sentence": "To mały Marek", "onlyNominative": true, "makesSense": false },
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

// read sentences from 'unit1.txt'
sentences = readFileSync(`./unit1.txt`, 'utf-8').split('\n');

for (let i = 0; i < 4; i++) {
	const newSentences = await askForUnit();

	console.log(newSentences.join('\n'));
	sentences = sentences.concat(newSentences);

	writeFileSync(`./unit1.txt`, sentences.join('\n'));
}
