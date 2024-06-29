import { z } from 'zod';
import type { Language, LanguageCode } from '../logic/types';
import { toMessages } from './ask';
import { askForJson } from './askForJson';

const names: Record<LanguageCode, string> = {
	pl: `Marek, Ewa, Jakub, Agnieszka`,
	fr: `Jacques, Charlotte, François, Jeanne`,
	es: `Juan, María, Pedro, Ana`,
	ko: `민준, 서연, 서준, 지우`,
	nl: `Jan, Emma, Willem, Sophie`,
	ru: `Дима, Катя, Ваня, Лена (or their formal versions)`
};

export async function generateExampleSentences(
	lemma: string,
	level: 'beginner' | 'easy' | 'normal' = 'normal',
	count: number = 10,
	language: Language
) {
	let { examples } = await askForJson({
		messages: toMessages({
			instruction: `Return JSON in the format { "examples": [ ... ]}. Do not translate.`,
			prompt:
				`Give ${count} ${language.name} sentences illustrating the use of the word "${lemma}". If the word is not a ${language.name} word, return an empty array of examples. ` +
				`The sentences are intended for adults. ` +
				`Use different styles such news text, fragments of dialog (e.g. in a shop, a workplace or a phone call, do not add the name of the speaker), fairy tales, informal language, reviews, advertising language, bureaucratic language, sayings, questions etc. ` +
				`If you need names of people, use ${names[language.code]}.` +
				(level != 'normal'
					? level == 'beginner'
						? ` Use only very simple words.`
						: ' Use only simple words.'
					: '')
		}),
		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'gpt-4o',
		logResponse: true
	});

	if (examples.length != count) {
		console.warn(`Expected ${count} examples, got ${examples.length}`);
	}

	const isEnglish = (sentence: string) =>
		sentence.match(/\bthe\b/) ||
		(language.code != 'nl' && sentence.match(/\bof\b/)) ||
		sentence.match(/\band\b/);

	if (examples.some(isEnglish)) {
		console.error(`Got English examples: ${examples.filter(isEnglish).join('\n')}`);

		examples = examples.filter((sentence) => !isEnglish(sentence));
	}

	console.log(
		`Got example sentences for ${lemma}: ${examples.map((sentence, i) => `\n ${i}) ` + sentence.slice(0, 100)).join('')}`
	);

	return examples;
}

export async function simplifySentences(
	sentences: { sentence: string; hard: string[]; lemmas: string[] }[],
	lemma: string,
	language: Language
) {
	sentences = sentences.filter(({ hard }) => hard.length);

	let { examples: simplified } = await askForJson({
		messages: [
			{
				role: 'system',
				content: `Return JSON in the format { "examples": [ ... ]}. No English. Use simple words.`
			},
			{
				role: 'user',
				content: `Give ${Math.max(sentences.length, 2)} ${language.name} sentences illustrating the use of the word "${lemma}".`
			},
			{
				role: 'assistant',
				content: JSON.stringify(
					sentences.map(({ sentence }) => sentence),
					null,
					2
				)
			},
			{
				role: 'user',
				content: `The following words are too difficult: ${dedup(
					sentences.flatMap(({ hard }) => hard)
				).join(', ')}.
				Change the sentences to not use these words or use simpler words. The sentences' meaning can change, but they still should illustrate the use of "${lemma}", be grammatically correct and make logical sense. Only write in ${language.name}.`
			}
		],

		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'gpt-4o'
	});

	simplified = simplified.map((sentence) => {
		if (sentence.includes('->')) {
			console.warn(`Got sentence with arrow from simplify: "${sentence}"`);

			sentence = sentence.split('->')[1].trim();
		}

		return sentence;
	});

	console.log(
		`Simplified sentences: ${sentences.map(({ sentence }, i) => `${sentence} -> ${simplified[i]}`).join('\n')}`
	);

	return simplified;
}

function dedup(array: string[]) {
	return [...new Set(array)];
}
