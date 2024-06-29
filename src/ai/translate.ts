import { z } from 'zod';
import { Message, ask, toMessages } from './ask';
import { askForJson } from './askForJson';
import type { Language, LanguageCode } from '../logic/types';

const formExamples: Record<LanguageCode, string> = {
	pl: `"genitive plural, feminine", "2nd person plural, past, imperfective" or "past participle"`,
	fr: `"feminine", "plural", or "past participle"`,
	es: `"feminine", "plural", or "past participle"`,
	ko: `"subject", "topic" or "imperative, polite"`,
	ru: `"genitive plural, feminine", "2nd person plural, past, imperfective" or "past participle"`,
	nl: `"plural, het", "past participle" or "de"`
};

const transliterationInstructions: Record<string, string> = {
	ko: ` Use dashes for syllable boundaries.`
};

export async function translateWordInContext(
	lemma: string,
	sentence: { sentence: string; english: string } | undefined,
	language: Language
) {
	let isFormWanted = !!sentence || language.code == 'ko';

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
						? `What is the English translation of the word "${lemma}" in this sentence?`
						: `What is the English translation of the ${language.name} word "${lemma}"?`) +
					` Only answer with the definition (as a fragment; no final full stop).` +
					(isFormWanted
						? `\nOn a second line, provide the form of the word in the sentence e.g. ${formExamples[language.code]}.`
						: '') +
					(!language.isLatin
						? `\nOn a new line, provide the transliteration in Latin script.${transliterationInstructions[language.code] || ''}`
						: '')
			}
		],
		temperature: 0.5,
		max_tokens: 30,
		logResponse: true,
		model: 'gpt-4o'
	});

	const lines = definition.split('\n');

	return {
		english: lines[0].trim(),
		form: isFormWanted ? lines[1] : undefined,
		transliteration: !language.isLatin ? lines[lines.length - 1] : undefined
	};
}

export async function translateSentences(
	sentences: string[],
	{
		temperature = 0.5,
		instruction,
		language,
		retriesLeft = 1
	}: {
		temperature?: number;
		instruction?: string;
		variableName?: string;
		retriesLeft?: number;
		language: Language;
	}
): Promise<{ translations: string[]; transliterations?: string[] }> {
	if (sentences.length === 0) {
		return { translations: [] };
	}

	let { translations, transliterations } = await askForJson({
		messages: toMessages({
			instruction:
				instruction ||
				`Translate the sentences in the JSON from ${language.name} to English.` +
					(language.isLatin
						? '\nReturn it as { translations: string[] }.'
						: '\nAlso provide the transliteration in Latin script as a string array. Return it in the format { translations: string[], transliterations: string[] }'),
			prompt: JSON.stringify({ sentences })
		}),
		temperature,
		max_tokens: 100 + sentences.reduce((sum, sentence) => sum + 4 * sentence.length, 0),
		schema: z.object({
			translations: z.array(z.string()),
			transliterations: z.array(z.string()).optional()
		}),
		model: 'gpt-3.5-turbo',
		logResponse: true
	});

	if (transliterations && transliterations.length !== sentences.length) {
		console.error(
			`Number of sentences does not match number of transliterations: ${sentences.length} vs ${transliterations.length}`
		);

		transliterations = undefined;
	}

	if (translations.length !== sentences.length) {
		let message = `Number of sentences does not match number of translations: ${sentences.length} vs ${translations.length}`;

		if (retriesLeft > 0) {
			console.error(message);
			console.error('Retrying with higher temperature...');

			return translateSentences(sentences, {
				temperature: temperature + (2 - temperature) / 2,
				instruction,
				language,
				retriesLeft: retriesLeft - 1
			});
		} else {
			throw new Error(message);
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

	return { translations, transliterations };
}
