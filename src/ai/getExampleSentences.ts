import { z } from 'zod';
import { promptForJson } from './promptForJson';

export async function getExampleSentences(lemma: string) {
	console.log(`Getting example sentences for ${lemma}...`);

	return (
		await promptForJson({
			instruction: `Print six Polish sentences illustrating the use of the entered word as JSON object with the key examples containing the sentences as an array.`,
			prompt: lemma,
			temperature: 1,
			max_tokens: 6 * 200,
			schema: z.object({ examples: z.array(z.string()) })
		})
	).examples;
}
