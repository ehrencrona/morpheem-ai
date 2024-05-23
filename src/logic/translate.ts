import {
	translateSentences,
	translateWordInContext as translateWordInContextAi
} from '../ai/translate';
import { storeEnglish } from '../db/sentences';
import * as DB from '../db/types';
import { addWordTranslations, getWordTranslation } from '../db/wordTranslations';

export async function addEnglishToSentence(
	sentence: DB.Sentence
): Promise<DB.Sentence & { english: string }> {
	if (!sentence.english) {
		const englishes = await translateSentences([sentence.sentence]);

		sentence.english = englishes[0];

		storeEnglish(sentence.english, sentence.id).catch(console.error);
	}

	return sentence as DB.Sentence & { english: string };
}

export async function translateWordInContext(
	word: DB.Word,
	sentence?: { id: number; sentence: string; english: string }
) {
	let translation: { english: string } | undefined = await getWordTranslation(
		word.id,
		sentence?.id || null
	);

	if (!translation) {
		translation = await translateWordInContextAi(word.word, sentence);

		await addWordTranslations({
			wordId: word.id,
			sentenceId: sentence?.id,
			english: translation.english
		});
	}

	return translation;
}
