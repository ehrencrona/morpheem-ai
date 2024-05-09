import { z } from 'zod';
import { toMessages } from './ask';
import { askForJson } from './askForJson';

export async function inventExampleSentences(lemma: string, count: number = 10) {
	let { examples } = await askForJson({
		messages: toMessages({
			instruction: `Return JSON in the format { "examples": [ ... ]}. Do not translate. Use simple words.`,
			prompt: `Give ${count} Polish sentences illustrating the use of the word "${lemma}".`
		}),
		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'gpt-4-turbo'
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
		`Got example sentences for ${lemma}: ${examples.map((sentence) => '\n  * ' + sentence.slice(0, 100)).join('')}`
	);

	return examples;
}

export async function simplifySentences(sentences: string[], hardWords: string[], lemma: string) {
	if (hardWords.length === 0) {
		return sentences;
	}

	const { examples: simplified } = await askForJson({
		messages: [
			{
				role: 'system',
				content: `Return JSON in the format { "examples": [ ... ]}. No English. Use simple words.`
			},
			{
				role: 'user',
				content: `Give ${sentences.length} Polish sentences illustrating the use of the word "${lemma}".`
			},
			{
				role: 'assistant',
				content: JSON.stringify(sentences, null, 2)
			},
			{
				role: 'user',
				content: `The following words are difficult: ${hardWords.join(', ')}.
				Can you simplify the Polish sentences and replace them by an easier word? Keep the word "${lemma}".`
			}
		],

		temperature: 1,
		max_tokens: 6 * 200,
		schema: z.object({ examples: z.array(z.string()) }),
		model: 'gpt-3.5-turbo'
	});

	console.log(
		`Simplified sentences: ${sentences.map((sentence, i) => `${sentence} -> ${simplified[i]}`).join('\n')}`
	);

	return simplified;
}
