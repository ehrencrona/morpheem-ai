import { z } from 'zod';
import { promptForJson } from './promptForJson';

export async function getExampleSentences(lemma: string, count: number = 10) {
	console.log(`Getting example sentences for ${lemma}...`);

	return (
		await promptForJson({
			instruction: `Print ${count} Polish sentences illustrating the use of the entered word as JSON in the format { "examples": [ ... ]}. Use simple words.`,
			prompt: lemma,
			temperature: 1,
			max_tokens: 6 * 200,
			schema: z.object({ examples: z.array(z.string()) })
		})
	).examples;
}
