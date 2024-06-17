import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

const translationResponseSchema = z.object({
	feedback: z.string(),
	correctedPart: z.string().optional(),
	errors: z
		.array(
			z.object({
				word: z.string(),
				shouldBe: z.string(),
				error: z.enum(['inflection', 'other'])
			})
		)
		.optional()
});

const writingResponseSchema = translationResponseSchema.extend({
	correctedSentence: z.string().optional()
});

export async function evaluateWrite(
	{ entered: sentence, word }: { entered: string; word: string },
	language: Language
): Promise<z.infer<typeof writingResponseSchema>> {
	return askForJson({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content: `I am learning ${language.name} and am doing an exercise to write a sentence using "${word}". 

You are a helpful teacher. Give feedback by briefly but friendly pointing out any errors. For grammatical errors, explain why it is wrong using grammatical terms. If the word "${word}" is missing, say so. 
Write in English. If the sentence is correct, praise the user. 

If there are errors, return a corrected text, applying all your suggestions. 

Also return just the that part of the sentence that was incorrect (if any) as a fragment, ignoring punctuation and minor typos, as well as what that part was corrected to. 

Return a list of individual words with errors and the type of error. Inflection errors are about choosing the wrong inflection form of the right word; typos or wrong word choices are "other". 

Return all this in JSON in the format {correctedSentence?: string, feedback: string, wrongPart?:string, correctedPart?: string, errors: {word: string, shouldBe: string, error: 'inflection'|'other}[]}`
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
					`Briefly but friendly point out any grammatical mistakes, spelling mistakes, unidiomatic constructs or divergences in meaning. Write in English. ` +
					`If the sentence generally captures the intended meaning and is grammatically correct (it does not need to match the provided translation), praise the user. ` +
					`Also return just the that part of the sentence that was incorrect (if any) as a fragment, ignoring punctuation and minor typos, as well as what that part was corrected to. ` +
					`Return a list of individual words with errors and the type of error. Inflection errors are about choosing the wrong inflection form of the right word; typos or wrong word choices are "other". ` +
					`Return JSON in the format {feedback: string, wrongPart?:string, correctedPart?: string, errors: {word: string, shouldBe: string, error: 'inflection'|'other}[]}`
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
