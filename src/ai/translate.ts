import { z } from 'zod';
import { promptForJson } from './promptForJson';

export async function translate(
	sentences: string[],
	{ temperature = 1 }: { temperature?: number } = {
		temperature: 1
	}
) {
	if (sentences.length === 0) {
		return [];
	}

	const englishes = (
		await promptForJson({
			instruction: `Translate the JSON from Polish to English.`,
			prompt: JSON.stringify({ sentences }),
			temperature,
			max_tokens: 100 + sentences.reduce((sum, sentence) => sum + 4 * sentence.length, 0),
			schema: z.object({ sentences: z.array(z.string()) })
		})
	).sentences;

	if (englishes.length !== sentences.length) {
		throw new Error(
			`Number of sentences does not match number of translations: ${sentences.length} vs ${englishes.length}`
		);
	}

	for (const index of Object.keys(englishes)) {
		const sentence = sentences[Number(index)];
		const english = englishes[Number(index)];

		if (
			(english?.length < sentence.length / 4 || english?.length > sentence.length * 4) &&
			Math.abs(english.length - sentence.length) > 10
		) {
			throw new Error(`Translation of ${sentence} failed: ${english}`);
		}
	}

	return englishes;
}
