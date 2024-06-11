import {
	translateSentences,
	translateWordInContext as translateWordInContextAi
} from '../ai/translate';
import { storeEnglish } from '../db/sentences';
import * as DB from '../db/types';
import { addWordTranslations, getWordTranslation } from '../db/wordTranslations';
import { standardize } from './isomorphic/standardize';
import { Language } from './types';

export async function addEnglishToSentence(
	sentence: DB.Sentence,
	language: Language
): Promise<DB.Sentence & { english: string }> {
	if (!sentence.english) {
		const englishes = await translateSentences([sentence.sentence], { language });

		sentence.english = englishes[0];

		storeEnglish(sentence.english, sentence.id, language).catch(console.error);
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
	let translation: { english: string; form?: string } | undefined = await getWordTranslation(
		lemma.id,
		sentence?.id || null,
		language
	);

	if (!translation) {
		translation = await translateWordInContextAi(
			wordString ? standardize(wordString) : lemma.word,
			sentence,
			language
		);

		await addWordTranslations({
			wordId: lemma.id,
			sentenceId: sentence?.id,
			english: translation.english,
			form: translation.form || undefined,
			language
		});
	}

	return translation;
}
