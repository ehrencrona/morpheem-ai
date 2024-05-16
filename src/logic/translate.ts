import { translateSentences } from '../ai/translate';
import { storeEnglish } from '../db/sentences';
import * as DB from '../db/types';

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
