import { z } from 'zod';
import { Sentence, readFromFile, saveToFile, units } from './syllabus';
import { askForJson } from '../../ai/askForJson';
import { parallelize } from '$lib/parallelize';
import { shuffle } from 'simple-statistics';

async function askForUnit(unit: number): Promise<Sentence[]> {
	const vocabulary: string[] = [];

	for (let i = 0; i < unit; i++) {
		vocabulary.push(...units[i].words);
	}

	return (
		await askForJson({
			messages: [
				{
					role: 'user',
					content: `
        The following is a Polish syllabus.

        We have studied the following units:
      
        ${Array.from({ length: unit }, (_, i) => `${units[i].name} (${units[i].abbr})`).join('\n') || 'None'}
        
        We have NOT yet studied the following units:

        ${Array.from({ length: units.length - unit }, (_, i) => `${units[i + unit + 1].name} (${units[i + unit + 1].abbr})`).join('\n') || 'None'}

        Below is the complete vocabulary of the course.
        
        Write sixty sentences (or multi-sentence texts) for the current unit ${units[unit].name} (${units[unit].abbr}), limiting yourself strictly to the vocabulary and grammar 
				of the units we have studied so far, but displaying as much diversity as possible within these limitations. 
				For example, use as subject that is a name (Ewa, Marek), a pronoun or another noun (mama, kot). Do not always use the same word order.
        Construct questions, statements, dialog.
        Use compound phrases if possible. Try to have the sentences make logical sense. A text can have multiple sentences, e.g. "Gdzie Ewa? Poszła do kina." or "Praca? Nie znalazłem."

        For each sentence, indicate all the units the sentence requires (in other words, if it uses perfective verbs print "perf", if it uses the accusative case singular, print "accsing") etc. 
        
        Vocabulary:
        
        ${shuffle(vocabulary).join(', ')}
        
        Return JSON, e.g.
        
        { "sentences": [
          [ "Marek ma psa", ["accsing"] ],
          [ "Ewa nie ma kota", ["gensing"] ] 
        ]}`
				}
			],
			model: 'claude-3-5-sonnet-20240620',
			temperature: 1,
			schema: z.object({
				sentences: z.array(z.tuple([z.string(), z.array(z.string()), z.array(z.string())]))
			})
		})
	).sentences.map((s) => ({
		sentence: s[0],
		units: s[1],
		words: s[2]
	}));
}

function pick(arr: any[], count: number) {
	const result = [];
	for (let i = 0; i < count; i++) {
		result.push(arr[Math.floor(Math.random() * arr.length)]);
	}
	return result;
}

function dedup(arr: string[]) {
	return arr.filter((item, index) => arr.indexOf(item) === index);
}

let sentences = readFromFile();

async function main() {
	parallelize(
		units.map((unit, i) => async () => {
			if (i > 4) {
				sentences = sentences.concat(await askForUnit(i));
				saveToFile(sentences);
			}
		}),
		1
	);
}

main();
