import { logError } from '$lib/logError';
import {
	translateSentences,
	translateWordInContext as translateWordInContextAi,
	translateWordOutOfContext as translateWordOutOfContextAi
} from '../ai/translate';
import { storeEnglish } from '../db/sentences';
import * as DB from '../db/types';
import { addWordTranslations, getWordTranslation } from '../db/wordTranslations';
import { Language } from './types';

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
		word
	}: {
		word: DB.Word;
		sentence: { id: number | undefined; sentence: string };
		language: Language;
		wordString?: string;
	}
) {
	let translation: Awaited<ReturnType<typeof translateWordInContextAi>> | undefined = sentence.id
		? await getWordTranslation(word.id, sentence.id, language)
		: undefined;

	if (!translation) {
		translation = await translateWordInContextAi(wordString, sentence, language);

		if (sentence.id) {
			addWordTranslations({
				wordId: word.id,
				sentenceId: sentence.id,
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

		addWordTranslations({
			wordId: word.id,
			sentenceId: undefined,
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
