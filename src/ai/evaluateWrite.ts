import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

const correctedPartSchema = z.object({
	correction: z.string(),
	userWrote: z.string().nullish(),
	english: z.string().nullish(),
	severity: z.number()
});

const writeEvaluationSchema = z.object({
	feedback: z.string(),
	correctedSentence: z.string(),
	correctedParts: z.array(correctedPartSchema)
});

export type CorrectedPart = z.infer<typeof correctedPartSchema>;

export async function evaluateWrite(
	exercise: ({ exercise: 'translate'; english: string } | { exercise: 'write'; word: string }) & {
		entered: string;
	},
	language: Language
): Promise<z.infer<typeof writeEvaluationSchema>> {
	return askForJson({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					`The user is learning ${language.name} and ` +
					(exercise.exercise == 'write'
						? `is doing an exercise to write a sentence using "${exercise.word}". `
						: `has been asked to translate a sentence as an exercise. `) +
					`Correct the sentence so that it grammatically correct, idiomatic and conveys the intended meaning. ` +
					`Then briefly but friendly give feedback, explaining why the corrections had to be applied. Write in English. ` +
					`For grammatical errors, explain why the error in grammatical terms. ` +
					`Also return a list of your corrections, in the exact same way they are written in the corrected sentence together with what the user wrote (when applicable) and the English translation of (only) the correction (if applicable). ` +
					`If a word is missing, include some context around the word in the correction. ` +
					`This will be used to highlight what was corrected. ` +
					`If the whole sentence was changed, break the corrections down into clauses. ` +
					`Categorize the severity of each error as 2 (wrong meaning), 1 (minor: a wrong inflection or a suboptimal word choice) or 0 (a typo or punctation). ` +
					`Return JSON in the format { correctedSentence: string, feedback: string, correctedParts: { correction: string, userWrote: string?, english: string?, severity: number }[] }`
			},
			{
				role: 'assistant',
				content:
					exercise.exercise == 'write'
						? `Write a ${language.name} sentence or fragment containing "${exercise.word}"`
						: `Translate the following sentence to ${language.name}: "${exercise.english}"`
			},
			{
				role: 'user',
				content: exercise.entered
			}
		],
		temperature: 1,
		logResponse: true,
		schema: writeEvaluationSchema
	});
}
