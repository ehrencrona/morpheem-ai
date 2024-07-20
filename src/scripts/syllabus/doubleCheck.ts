import { toBatches } from '$lib/batch';
import { z } from 'zod';
import { askForJson } from '../../ai/askForJson';
import { Sentence, readFromFile, saveToFile, units } from './syllabus';
import { parallelize } from '$lib/parallelize';

async function getUnits(sentences: Sentence[], query: string) {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content:
					`For each of these Polish sentences, return which cases they are using out of the following list:
					accsing: Accusative Singular
					gensing: Genitive Singular
					locsing: Locative Singular
					datsing: Dative Singular
					instsing: Instrumental Singular
					nompl: Nominative Plural
					accpl: Accusative Plural
					genpl: Genitive Plural
					locpl: Locative Plural
					
					Also determine verb tenses from this list

					refl: Reflexive verbs
					perf: Perfective verbs
					past: Past tense
					compfut: Compound future
					simpfut: Simple future

					` +
					`\n\nSentences:\n` +
					sentences.map((sentence) => `- ${sentence.sentence}`).join('\n') +
					`\n Return JSON in the format
					
					{ sentences: [ 
					 		{ "sentence": "Ja widzę twój nowy dom.", "cases": ["accsing"], "tenses": [] },
					 		{ "sentence": "Marek lubił wino.", "cases": ["accsing"], "tenses": ["past"] },							 
					] }`
			}
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 1,
		schema: z.object({
			sentences: z.array(
				z.object({
					sentence: z.string(),
					cases: z.array(z.string()),
					tenses: z.array(z.string())
				})
			)
		})
	});

	return sentences.map((sentence) => {
		const match = res.sentences.find((s) => s.sentence == sentence.sentence);

		if (!match) {
			console.log(
				`No match for sentence: ${sentence.sentence}, only found: ${res.sentences.map((s) => s.sentence).join(', ')}`
			);

			return [];
		} else {
			return match.cases.concat(match.tenses).map((unit) => {
				if (unit == 'refl' || unit == 'instsing') {
					return 'reflinstr';
				} else {
					return unit;
				}
			});
		}
	});
}

let sentences = readFromFile();

sentences = sentences.map((sentence) => ({ ...sentence, sentence: sentence.sentence.trim() }));
sentences = sentences.map((sentence) => ({
	...sentence,
	sentence: sentence.sentence.replace(/^[1-9]\. /, '')
}));

const batches = toBatches(sentences, 30);

await parallelize(
	batches.map((batch) => async () => {
		const units = await getUnits(batch, 'units');

		for (let i = 0; i < batch.length; i++) {
			batch[i].units = dedup(units[i].concat(batch[i].units));

			console.log(batch[i].sentence, batch[i].units);
		}

		saveToFile(sentences);
	}),
	4
);

function dedup(arr: string[]) {
	return arr.filter((item, index) => arr.indexOf(item) === index);
}
