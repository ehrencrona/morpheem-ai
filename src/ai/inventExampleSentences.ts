import { z } from 'zod';
import { toMessages } from './ask';
import { askForJson } from './askForJson';

export async function inventExampleSentences(
	lemma: string,
	level: 'beginner' | 'easy' | 'normal' = 'normal',
	count: number = 10
) {
	let { examples } = await askForJson({
		messages: toMessages({
			instruction: `Return JSON in the format { "examples": [ ... ]}. Do not translate. Use simple words.`,
			prompt:
				`Give ${count} Polish sentences illustrating the use of the word "${lemma}".` +
				(level != 'normal' ? ` Use only simple words.` : ' Use only beginner words.')
		}),
		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'gpt-4p'
	});

	if (examples.length != count) {
		console.warn(`Expected ${count} examples, got ${examples.length}`);
	}

	const isEnglish = (sentence: string) =>
		sentence.match(/\bthe\b/) || sentence.match(/\bof\b/) || sentence.match(/\band\b/);

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
	lemma: string
) {
	sentences = sentences.filter(({ hard }) => hard.length);

	const { examples: simplified } = await askForJson({
		messages: [
			{
				role: 'system',
				content: `Return JSON in the format { "examples": [ ... ]}. No English. Use simple words.`
			},
			{
				role: 'user',
				content: `Give ${Math.max(sentences.length, 2)} Polish sentences illustrating the use of the word "${lemma}".`
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
				Can you rewrite the Polish sentences using simpler words? Keep the word "${lemma}".`
			}
		],

		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'gpt-3.5-turbo'
	});

	console.log(
		`Simplified sentences: ${sentences.map(({ sentence }, i) => `${sentence} -> ${simplified[i]}`).join('\n')}`
	);

	return simplified;
}

function dedup(array: string[]) {
	return [...new Set(array)];
}
