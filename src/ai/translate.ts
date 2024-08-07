import { z } from 'zod';
import type { Language, LanguageCode } from '../logic/types';
import { ask, toMessages } from './ask';
import { askForJson } from './askForJson';

export interface TranslatedWord {
	english: string;
	form?: string;
	transliteration?: string;
	expression?: {
		expression: string;
		english: string;
	};
}

const formExamples: Record<LanguageCode, string> = {
	pl: `"genitive plural, feminine", "2nd person plural, past, imperfective" or "past participle"`,
	fr: `"feminine", "plural", or "past participle"`,
	es: `"feminine", "plural", or "past participle"`,
	ko: `"subject", "from" or "imperative, polite"`,
	ru: `"genitive plural, feminine", "2nd person plural, past, imperfective" or "past participle"`,
	nl: `"plural, het", "past participle" or "de"`,
	sv: `"plural, ett", or "past participle"`
};

const idiomExample: Record<LanguageCode, string> = {
	pl: 'stanowisko pracy - workplace',
	fr: 'coup de grâce - finishing blow',
	es: 'estar en las nubes - to be daydreaming',
	ko: '바람을 타다 - to be stood up',
	ru: 'без ума от кого-то - to be crazy about someone',
	nl: 'voor aap staan - to be made a fool of',
	sv: 'att slå huvudet på spiken - to hit the nail on the head'
};

const transliterationInstructions: Record<string, string> = {
	ko: ` Use dashes for syllable boundaries.`
};

export async function translateWordOutOfContext(wordString: string, language: Language) {
	const definition = await ask({
		messages: [
			{
				role: 'user',
				content:
					`Print the English translation of the ${language.name} "${wordString}" in the style of a bilingual dictionary entry. Print only the entry itself; no introduction. No initial capital, no final period, do not repeat the word itself.\n` +
					`On a second line, provide the form${language.code == 'ko' ? '/particle' : ''} of the word in the sentence e.g. ${formExamples[language.code]}.` +
					(!language.isLatin
						? `\nOn a second line, provide the transliteration in Latin script.${transliterationInstructions[language.code] || ''}`
						: '')
			}
		],
		temperature: 0.5,
		max_tokens: 100,
		logResponse: true,
		model: 'gpt-4o'
	});

	const lines = definition.split('\n');

	return {
		english: lines[0].trim().replace(/^"|"$/g, ''),
		transliteration: !language.isLatin ? lines[lines.length - 1] : undefined
	};
}

export async function translateWordInContext(
	wordString: string,
	sentence: { sentence: string },
	language: Language
): Promise<TranslatedWord> {
	let doTransliterate = !language.isLatin;

	const response = await askForJson({
		messages: [
			{
				role: 'user',
				content:
					`For the ${language.name} sentence "${sentence.sentence}", give the single most relevant English dictionary entry of "${wordString}". Do not give multiple options.\n` +
					`For non-semantic names, just repeat the name as the translation. Align the translation in number, person, tense etc with the original.\n` +
					`If "${wordString}" is part of an idiom or set phrase, use the literal translation but also return the idiom in ${language.name} and English (e.g "${idiomExample[language.code]}"). Only for idioms, not e.g. phrasal verbs.\n` +
					`Also provide the form of the word in the sentence e.g. ${formExamples[language.code]}. For names, add "name" to the form.\n` +
					(doTransliterate
						? `\nAlso give the transliteration in Latin script.${transliterationInstructions[language.code] || ''}\n`
						: '') +
					`Return JSON: { definition: string, form:string${doTransliterate ? `, transliteration: string` : ''}, idiom?: string }.`
			}
		],
		temperature: 0,
		logResponse: true,
		model: 'claude-3-5-sonnet-20240620',
		schema: z.object({
			definition: z.string(),
			form: z.string(),
			transliteration: z.string().optional(),
			idiom: z.string().nullish()
		})
	});

	let expression: { expression: string; english: string } | undefined;

	if (response.idiom) {
		const [targetLanguage, english] = response.idiom.split(/ [-/=] /);

		if (targetLanguage && english) {
			expression = { expression: targetLanguage, english };
		} else {
			console.warn(
				`Expected expression translation to be preceded by a dash separated by spaces: ${response.idiom}`
			);
		}
	}

	console.log(
		`Translated the ${language.name} "${wordString}" to "${response.definition}" in the context of "${getContextOf(wordString, sentence.sentence)}"`
	);

	return {
		english: response.definition,
		form: response.form,
		transliteration: response.transliteration,
		expression
	};
}

function getContextOf(word: string, sentence: string) {
	const index = sentence.indexOf(word);

	if (index === -1) {
		return sentence;
	}

	const contextLength = 20;

	return (
		(contextLength > index ? '' : '...') +
		sentence
			.substring(
				Math.max(0, index - contextLength),
				Math.min(sentence.length, index + word.length + contextLength)
			)
			.trim() +
		(index + word.length + contextLength < sentence.length ? '...' : '')
	);
}

export async function translateSentences(
	sentences: string[],
	opts: {
		language: Language;
		temperature?: number;
		retriesLeft?: number;
		literalTranslation?: boolean;
	}
): Promise<{ translations: string[]; transliterations?: string[] }> {
	const { temperature = 0.5, language, retriesLeft = 1, literalTranslation = false } = opts;

	if (sentences.length === 0) {
		return { translations: [] };
	}

	let { translations, transliterations } = await askForJson({
		messages: toMessages({
			instruction:
				`Translate the entries in the JSON from ${language.name} to English.` +
				(literalTranslation ? ' Prefer a somewhat literal translation.' : '') +
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
		model: 'gpt-4o',
		logResponse: true
	});

	if (transliterations && transliterations.length !== sentences.length) {
		console.error(
			`Number of sentences does not match number of transliterations: ${sentences.length} vs ${transliterations.length}`
		);

		transliterations = undefined;
	}

	if (translations.length !== sentences.length) {
		let message = `Number of sentences does not match number of translations: ${sentences.length} vs ${translations.length}:\nSentences:\n${sentences.join('\n - ')}.\nTranslations:\n${translations.join('\n - ')}`;

		if (retriesLeft > 0) {
			console.error(message);
			console.error('Retrying with higher temperature...');

			return translateSentences(sentences, {
				...opts,
				temperature: temperature + (2 - temperature) / 2,
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
