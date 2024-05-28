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
		const englishes = await translateSentences([sentence.sentence], { language });

		sentence.english = englishes[0];

		storeEnglish(sentence.english, sentence.id, language).catch(console.error);
	}

	return sentence as DB.Sentence & { english: string };
}

export async function translateWordInContext(
	word: DB.Word,
	{
		sentence,
		language
	}: {
		sentence: { id: number; sentence: string; english: string } | undefined;
		language: Language;
	}
) {
	let translation: { english: string } | undefined = await getWordTranslation(
		word.id,
		sentence?.id || null,
		language
	);

	if (!translation) {
		translation = await translateWordInContextAi(word.word, sentence, language);

		await addWordTranslations({
			wordId: word.id,
			sentenceId: sentence?.id,
			english: translation.english,
			language
		});
	}

	return translation;
}
