import { z } from 'zod';
import { Language, LanguageCode } from '../logic/types';
import { toMessages } from './ask';
import { askForJson } from './askForJson';

const examples: Record<LanguageCode, string> = {
	es: `{ cloze: "No sé ___.", englishMisisngPart: "what to say", rightAnswer: "qué decir", correctness: "The sentence is grammatically correct and sensible and tests using irrogative pronouns.", isCorrect: true }`,
	ko: `{ cloze: "나는 _____ 말할지 모르겠어.", englishMisisngPart: "what", rightAnswer: "뭐라고", correctness: "The sentence is grammatically correct and sensible and tests using irrogative pronouns.", isCorrect: true }`,
	pl: `{ cloze: "Nie wiem ___.", englishMisisngPart: "what to say", rightAnswer: "co powiedzieć", correctness: "The sentence is grammatically correct and sensible and tests using irrogative pronouns.", isCorrect: true }`,
	ru: `{ cloze: "Я не знаю ___.", englishMisisngPart: "what to say", rightAnswer: "что сказать", correctness: "The sentence is grammatically correct and sensible and tests using irrogative pronouns.", isCorrect: true }`,
	nl: `{ cloze: "Ik weet niet ___.", englishMisisngPart: "what to say", rightAnswer: "wat te zeggen", correctness: "The sentence is grammatically correct and sensible and tests using irrogative pronouns.", isCorrect: true }`,
	fr: `{ cloze: "Je ne sais pas ___.", englishMisisngPart: "what to say", rightAnswer: "quoi dire", correctness: "The sentence is grammatically correct and sensible and tests using irrogative pronouns.", isCorrect: true }`
};

export function generateCloze(
	skill: string,
	{ numberOfExercises = 8, language }: { numberOfExercises: number; language: Language }
) {
	return askForJson({
		messages: toMessages({
			instruction: `Return exercises as JSON in the format { structure: string, exercises: { cloze: string, englishMissingPart: string, rightAnswer: string, correctness: string, isCorrect: boolean } [] }      
      In the cloze string, indicate the blank by three underscores.
			Example: ${examples[language.code]}`,
			prompt: `
      I find it difficult to ${skill} in ${language.name}. 
			Give me ${numberOfExercises} fill-in-the-blanks exercises in the form of ${language.name} sentences to test it. 
			Reason about what how the exercises should be structured and useful words or phrases (in "structure"), then return the exercises. Prefer simple words.
      Then double-check each exercise to check that the sentence is grammatically correct and sensible and tests the right skill. 
      Return your conclusion in correctness as a string, then as a boolean in isCorrect.`
		}),
		model: 'claude-3-5-sonnet-20240620',
		temperature: 1,
		schema: z.object({
			exercises: z.array(
				z.object({
					cloze: z.string(),
					englishMissingPart: z.string(),
					rightAnswer: z.string(),
					correctness: z.string(),
					isCorrect: z.boolean()
				})
			)
		}),
		logResponse: true
	});
}
