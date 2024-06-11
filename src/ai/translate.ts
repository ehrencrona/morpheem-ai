import { z } from 'zod';
import { Message, ask, toMessages } from './ask';
import { askForJson } from './askForJson';
import { Language } from '../logic/types';

export async function translateWordInContext(
	lemma: string,
	sentence: { sentence: string; english: string } | undefined,
	language: Language
) {
	const definition = await ask({
		messages: [
			...(sentence?.english
				? ([
						{
							role: 'user',
							content: `Translate the ${language.name} sentence "${sentence.sentence}" into English.`
						},
						{ role: 'assistant', content: sentence.english }
					] as Message[])
				: []),
			{
				role: 'user',
				content:
					(sentence
						? `What is the English translation of the word "${lemma}" in the sentence?`
						: `What is the English translation of the ${language.name} word "${lemma}"?`) +
					` Only answer with the definition (as a fragment; no final full stop). ` +
					(language.code == 'pl' && sentence
						? `On a second line, provide the case and number in the sentence e.g. "genitive plural, feminine" or "past participle".`
						: '')
			}
		],
		temperature: 0.5,
		max_tokens: 30,
		logResponse: true,
		model: 'gpt-4o'
	});

	const lines = definition.split('\n');

	return { english: lines[0], form: lines[1] || undefined };
}

export async function translateWords(words: string[], language: Language) {
	return translateSentences(words, {
		temperature: 0,
		instruction: `Translate the JSON of ${language.name} dictionary words to their English definitions without changing the JSON format.`,
		language
	});
}

export async function translateSentences(
	sentences: string[],
	{
		temperature = 0.5,
		instruction,
		variableName = 'sentences',
		language
	}: { temperature?: number; instruction?: string; variableName?: string; language: Language }
): Promise<string[]> {
	if (sentences.length === 0) {
		return [];
	}

	const translations = (
		await askForJson({
			messages: toMessages({
				instruction: instruction || `Translate the JSON from ${language.name} to English.`,
				prompt: JSON.stringify({ [variableName]: sentences })
			}),
			temperature,
			max_tokens: 100 + sentences.reduce((sum, sentence) => sum + 4 * sentence.length, 0),
			schema: z.object({ [variableName]: z.array(z.string()) }),
			model: 'gpt-3.5-turbo'
		})
	)[variableName];

	if (translations.length !== sentences.length) {
		console.error(
			`Number of sentences does not match number of translations: ${sentences.length} vs ${translations.length}`
		);

		if (sentences.length > 1) {
			return (
				await Promise.all(
					sentences.map((sentence) => translateSentences([sentence], { temperature, language }))
				)
			).flat();
		} else if (translations.length) {
			return translations.slice(0, 1);
		} else {
			console.error({ polishes: sentences, englishes: translations });

			throw new Error(`Failed to translate ${sentences.length} sentences.`);
		}
	}

	for (const index of Object.keys(translations)) {
		const sentence = sentences[Number(index)];
		const english = translations[Number(index)];

		if (
			(english?.length < sentence.length / 4 || english?.length > sentence.length * 4) &&
			Math.abs(english.length - sentence.length) > 10
		) {
			throw new Error(`Translation of ${sentence} failed: ${english}`);
		}
	}

	return translations;
}
