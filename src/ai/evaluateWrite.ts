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
	exercise: (
		| { exercise: 'translate'; english: string; correct: string }
		| { exercise: 'write'; word: string; english: string }
		| { exercise: 'writer' }
	) & {
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
						? `is doing an exercise to write a sentence using the ${language.name} word for "${exercise.english}". The word we wanted to see was "${exercise.word}", but using another word matching "${exercise.english}" is fine (but point out that "${exercise.word}" was intended). `
						: exercise.exercise == 'writer'
							? `is doing a writing exercise. `
							: `has been asked to translate a sentence as an exercise. The expected answer is "${exercise.correct}" `) +
					`Correct the user's answer so that it grammatically correct and conveys the intended meaning.
					${language.code == 'es' ? `Latin American Spanish is acceptable; do not replace it with Castilian.` : ''}
					Replace any proper nouns (e.g. iPhone, McDonalds) with generic terms.
					${
						exercise.exercise == 'translate'
							? " The user's sentence does not need to match the expected answer, only the English prompt provided."
							: exercise.exercise == 'writer'
								? `The user may leave parts of the sentence in English or another language because they did not know them in ${language.name}. Correct these to ${language.name}.`
								: ''
					} ` +
					`Then briefly but friendly give feedback, explaining why the corrections had to be applied. Write in English. Use grammatical terminology. ` +
					`Also return a list of your corrections, in the exact same way they are written in the corrected sentence together with what the user wrote (when applicable) and the English translation of (only) the correction. ` +
					`If a word is missing, include some context around the word in the correction. ` +
					`If the whole sentence was changed, break the corrections down into clauses. ` +
					`Categorize the severity of each error as 2 (wrong meaning), 1 (minor: a wrong inflection or a suboptimal word choice) or 0 (a typo or punctation). ` +
					`Return JSON in the format { correctedSentence: string, feedback: string, correctedParts: { userWrote: string?, correction: string, english: string?, severity: number }[] }`
			},
			{
				role: 'assistant',
				content:
					exercise.exercise == 'write'
						? `Write a ${language.name} sentence or fragment containing "${exercise.word}"`
						: exercise.exercise == 'writer'
							? `Write a text in ${language.name}.`
							: `Translate the following English sentence to ${language.name}: "${exercise.english}"`
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
