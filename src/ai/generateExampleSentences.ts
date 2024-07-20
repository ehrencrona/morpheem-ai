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
	ru: `Дима, Катя, Ваня, Лена (or their formal versions)`,
	sv: `Erik, Anna, Lars, Kristina`
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
				`Use different styles such news text, fragments of dialog (e.g. in a shop, a workplace or a phone call, do not add the name of the speaker), fairy tales, informal conversation, reviews, ` +
				`advertising language, ${language.code != 'sv' /* too much of this in swedish */ ? `bureaucratic language, ` : ''}sayings, questions etc. ` +
				`If you need names of people, use ${names[language.code]}. Avoid using other names of people, products or brands.` +
				(level != 'normal'
					? level == 'beginner'
						? ` Use only very simple words.`
						: ' Use only simple words.'
					: '')
		}),
		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'claude-3-5-sonnet-20240620',
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

	return examples;
}

export async function simplifySentences(
	sentences: { sentence: string; hard: string[] }[],
	lemma: string,
	language: Language
) {
	sentences = sentences.filter(({ hard }) => hard.length);

	let { examples: simplified } = await askForJson({
		messages: [
			{
				role: 'user',
				content:
					`I need ${Math.max(sentences.length, 2)} ${language.name} sentences illustrating the use of the word "${lemma}". I got the following sentences:\n` +
					sentences.map(({ sentence }) => ' - ' + sentence).join('\n') +
					`\n\nThe following words are too difficult: ${dedup(
						sentences.flatMap(({ hard }) => hard)
					).join(', ')}.
				Write new sentences that do not use them, either by modifying the sentences or by making up new ones. All sentences should still should illustrate the use of "${lemma}", be grammatically correct and make logical sense. Only write in ${language.name}, no English.
				Return JSON in the format { "examples": string[] }. The sentences are for a beginner learner, so use simple words.`
			}
		],
		temperature: 1,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'claude-3-5-sonnet-20240620'
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
