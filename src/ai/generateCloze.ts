import { z } from 'zod';
import { Language } from '../logic/types';
import { toMessages } from './ask';
import { askForJson } from './askForJson';

export function generateCloze(
	skill: string,
	{ numberOfExercises = 8, language }: { numberOfExercises: number; language: Language }
) {
	return askForJson({
		messages: toMessages({
			instruction: `Return exercises as JSON in the format { structure: string, exercises: { cloze: string, correctness: string, isCorrect: boolean } [] }
      
      In the cloze string, indicate the blank by three underscores followed by the correct answer in parenthesis i.e. ___ (answer here)`,
			prompt: `
      I find it difficult to ${skill} in ${language.name}. 
			Give me ${numberOfExercises} fill-in-the-blanks exercises in the form of Polish sentences with a single word missing to test it. 
			Reason about what how the exercises should be structured and useful words or phrases (in "structure"), then return the exercises.
			There may only be a single word in the blank. Prefer simple words.
      Then double-check each exercise to check that the sentence is grammatically correct and sensible and tests the right skill. 
      Return your conclusion in correctness as a string, then as a boolean in isCorrect.`
		}),
		model: 'gpt-4o',
		temperature: 0.5,
		schema: z.object({
			exercises: z.array(
				z.object({
					cloze: z.string(),
					correctness: z.string(),
					isCorrect: z.boolean()
				})
			)
		}),
		logResponse: true
	});
}
