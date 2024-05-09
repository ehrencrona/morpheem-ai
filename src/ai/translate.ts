import { z } from 'zod';
import { askForJson } from './askForJson';
import { openai } from './openai-client';
import { Message, ask, toMessages } from './ask';

export async function explain(word: string) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-4-turbo',
		messages: [
			{
				role: 'user',
				content: `Very briefly explain the Polish word "${word}". What meanings does it have? Can it be broken down into meaningful parts? If yes, please explain them, otherwise don't mention it. What similar words exist in terms of stem or similar etymology?`
			}
		],
		temperature: 1
	});

	return (completion.choices[0].message.content || '').split(`\n\n`);
}

export async function translateWordInContext(
	lemma: string,
	sentence: { sentence: string; english: string | null }
) {
	const definition = await ask({
		messages: [
			...(sentence.english
				? ([
						{
							role: 'user',
							content: `Translate the Polish sentence "${sentence.sentence}" into English.`
						},
						{ role: 'assistant', content: sentence.english }
					] as Message[])
				: []),
			{
				role: 'user',
				content: `What's the meaning of the word "${lemma}"? Only answer with the definition.`
			}
		],
		temperature: 0.5,
		max_tokens: 30
	});

	return { english: definition };
}

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
		await askForJson({
			messages: toMessages({
				instruction: instruction || `Translate the JSON from Polish to English.`,
				prompt: JSON.stringify({ [variableName]: polishes })
			}),
			temperature,
			max_tokens: 100 + polishes.reduce((sum, sentence) => sum + 4 * sentence.length, 0),
			schema: z.object({ [variableName]: z.array(z.string()) }),
			model: 'gpt-3.5-turbo'
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
