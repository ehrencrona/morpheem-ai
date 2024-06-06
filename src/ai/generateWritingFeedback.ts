import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

const writingResponseSchema = z.object({
	feedback: z.string(),
	corrected: z.string(),
	word: z.string().optional(),
	isCorrect: z.boolean()
});

const translationResponseSchema = z.object({
	feedback: z.string(),
	word: z.string().optional(),
	isCorrect: z.boolean()
});

export async function generateWritingFeedback(
	sentence: string,
	word: string,
	language: Language
): Promise<z.infer<typeof writingResponseSchema>> {
	return askForJson({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					`The user is learning ${language.name} and, as an exercise, is trying to write a sentence containing the word "${word}". ` +
					`Briefly but friendly point out any grammatical mistakes, spelling mistakes or unidiomatic constructs. If the word is missing, say so. ` +
					`If the sentence is correct, praise the user. Also return a corrected text, applying all your suggestions. ` +
					`Return a boolean indicating whether the sentence was grammatically correct (ignoring punctuation). ` +
					`If there is only a single word that is incorrect return it (as it is written in the corrected sentence). ` +
					`Write in English. Return JSON in the format {feedback: string, corrected: string, isCorrect: boolean, word?: string}`
			},
			{
				role: 'assistant',
				content: `Write a ${language.name} sentence or fragment containing "${word}"`
			},
			{
				role: 'user',
				content: sentence
			}
		],
		temperature: 1,
		logResponse: true,
		schema: writingResponseSchema
	});
}

export async function generateTranslationFeedback(
	{ english, correct, entered }: { english: string; correct: string; entered: string },
	language: Language
): Promise<z.infer<typeof translationResponseSchema>> {
	return askForJson({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					`The user is learning ${language.name} and being asked to translate a sentence as an exercise. ` +
					`The correct translation is "${correct}". The user will be shown it; no need to mention it. ` +
					`Briefly but friendly point out any grammatical mistakes, spelling mistakes, unidiomatic constructs or divergences in meaning. ` +
					`If the sentence generally captures the intended meaning and is grammatically correct (it does not need to match the provided translation), praise the user. ` +
					`Return a boolean indicating whether it is a correct translation. ` +
					`If there is only a single word that is incorrect return it (as it is written in the correct translation). ` +
					`Write in English. Return JSON in the format {feedback: string, isCorrect:boolean, word?:string}`
			},
			{
				role: 'assistant',
				content: `Translate the following sentence to ${language.name}: "${english}"`
			},
			{
				role: 'user',
				content: entered
			}
		],
		temperature: 1,
		logResponse: true,
		schema: translationResponseSchema
	});
}
