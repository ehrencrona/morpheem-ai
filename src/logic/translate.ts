import { logError } from '$lib/logError';
import {
	translateSentences,
	translateWordInContext as translateWordInContextAi
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
	lemma: DB.Word,
	{
		sentence,
		language,
		wordString
	}: {
		sentence: { id: number; sentence: string; english: string } | undefined;
		language: Language;
		wordString?: string;
	}
) {
	let translation: { english: string; form?: string; transliteration?: string } | undefined =
		await getWordTranslation(lemma.id, sentence?.id || null, language);

	if (!translation) {
		translation = await translateWordInContextAi(
			wordString ? wordString : lemma.word,
			sentence,
			language
		);

		addWordTranslations({
			wordId: lemma.id,
			sentenceId: sentence?.id,
			english: translation.english,
			form: translation.form || undefined,
			transliteration: translation.transliteration,
			language
		}).catch((e) => {
			e.message = `Error adding word translation for ${lemma.word}, sentence ${sentence?.id} in ${language.name}: ${e.message}`;
			logError(e);
		});
	}

	return translation;
}
