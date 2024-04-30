import { z } from 'zod';
import { promptForJson } from './promptForJson';

export async function translateWords(words: string[]) {
	return translateSentences(words, {
		temperature: 0,
		instruction:
			'Translate the JSON of Polish dictionary words to their English definitions without changing the JSON format.'
	});
}

export async function translateSentences(
	polishes: string[],
	{
		temperature = 0.5,
		instruction,
		variableName = 'sentences'
	}: { temperature?: number; instruction?: string; variableName?: string } = {}
): Promise<string[]> {
	if (polishes.length === 0) {
		return [];
	}

	const englishes = (
		await promptForJson({
			instruction: instruction || `Translate the JSON from Polish to English.`,
			prompt: JSON.stringify({ [variableName]: polishes }),
			temperature,
			max_tokens: 100 + polishes.reduce((sum, sentence) => sum + 4 * sentence.length, 0),
			schema: z.object({ [variableName]: z.array(z.string()) })
		})
	)[variableName];

	if (englishes.length !== polishes.length) {
		console.error(
			`Number of sentences does not match number of translations: ${polishes.length} vs ${englishes.length}`
		);

		if (polishes.length > 1) {
			return (
				await Promise.all(
					polishes.map((sentence) => translateSentences([sentence], { temperature }))
				)
			).flat();
		} else if (englishes.length) {
			return englishes.slice(0, 1);
		} else {
			console.error({ polishes, englishes });

			throw new Error(`Failed to translate ${polishes.length} sentences.`);
		}
	}

	for (const index of Object.keys(englishes)) {
		const sentence = polishes[Number(index)];
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
