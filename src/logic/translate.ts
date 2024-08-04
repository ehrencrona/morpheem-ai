import { logError } from '$lib/logError';
import {
	TranslatedWord,
	translateSentences,
	translateWordInContext as translateWordInContextAi,
	translateWordOutOfContext as translateWordOutOfContextAi
} from '../ai/translate';
import { storeEnglish } from '../db/sentences';
import * as DB from '../db/types';
import {
	addWordTranslation,
	getAllWordTranslations,
	getWordTranslation
} from '../db/wordTranslations';
import { Language } from './types';

export interface QuicklyTranslatedWord extends TranslatedWord {
	isQuickAndDirty?: boolean;
}

export async function addEnglishToSentence(
	sentence: DB.Sentence,
	language: Language
): Promise<DB.Sentence & { english: string }> {
	if (!sentence.english) {
		const { translations, transliterations } = await translateSentences([sentence.sentence], {
			language,
			literalTranslation: false
		});

		sentence.english = translations[0];
		sentence.transliteration = transliterations?.[0] || null;

		storeEnglish({ english: sentence.english || '' }, { sentenceId: sentence.id, language }).catch(
			logError
		);
	}

	return sentence as DB.Sentence & { english: string };
}

export async function translateWordInContext(
	wordString: string,
	{
		sentence,
		language,
		word,
		isQuickAndDirty
	}: {
		word: DB.Word;
		sentence: { id: number | undefined; sentence: string };
		language: Language;
		wordString?: string;
		isQuickAndDirty?: boolean;
	}
): Promise<QuicklyTranslatedWord> {
	let translation: QuicklyTranslatedWord | undefined = sentence.id
		? await getWordTranslation(word.id, sentence.id, language)
		: undefined;

	if (!translation && isQuickAndDirty && sentence.id) {
		translation = await getQuickAndDirtyTranslation(word, language, wordString);
	}

	if (!translation) {
		translation = await translateWordInContextAi(wordString, sentence, language);

		if (sentence.id) {
			addWordTranslation({
				wordId: word.id,
				sentenceId: sentence.id,
				inflected: wordString,
				english: translation.english,
				form: translation.form || undefined,
				transliteration: translation.transliteration,
				expression: translation.expression,
				language
			}).catch((e) => {
				logError(
					e,
					`Error adding word translation for ${wordString} (${word.id}), sentence ${sentence?.id} in ${language.name}`
				);
			});
		}
	}

	return translation;
}

async function getQuickAndDirtyTranslation(word: DB.Word, language: Language, wordString: string) {
	const translations = await getAllWordTranslations({
		wordId: word.id,
		language,
		inflected: wordString
	});

	let translation: QuicklyTranslatedWord | undefined;

	translation = translations.find(({ sentence_id }) => sentence_id == null);

	if (!translation && translations.length) {
		const translationCounts = translations.reduce((acc, { english }) => {
			acc.set(english, (acc.get(english) || 0) + 1);
			return acc;
		}, new Map<string, number>());

		const mostCommonTranslation = [...translationCounts.entries()].reduce((a, b) =>
			a[1] > b[1] ? a : b
		)[0];

		translation = translations.find(({ english }) => english == mostCommonTranslation)!;
	}

	if (translation) {
		translation.expression = undefined;
		translation.isQuickAndDirty = true;
	}

	return translation;
}

export async function translateWordOutOfContext(
	wordString: string,
	{
		language,
		word
	}: {
		word: DB.Word;
		language: Language;
		wordString?: string;
	}
) {
	let translation: { english: string; form?: string; transliteration?: string } | undefined =
		await getWordTranslation(word.id, null, language);

	if (!translation) {
		translation = await translateWordOutOfContextAi(wordString, language);

		addWordTranslation({
			wordId: word.id,
			sentenceId: undefined,
			inflected: wordString,
			english: translation.english,
			form: translation.form || undefined,
			transliteration: translation.transliteration,
			language
		}).catch((e) => {
			logError(
				e,
				`Error adding word translation for ${wordString} (${word.id}) in ${language.name}`
			);
		});
	}

	return translation;
}
