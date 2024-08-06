import { z } from 'zod';
import { Language, LanguageCode } from '../logic/types';
import { toMessages } from './ask';
import { askForJson } from './askForJson';

const examples: Record<LanguageCode, string> = {
	es: `{ cloze: "No sé ___.", englishMissingPart: "what to say", rightAnswer: "qué decir" }`,
	ko: `{ cloze: "나는 _____ 말할지 모르겠어.", englishMissingPart: "what", rightAnswer: "뭐라고" }`,
	pl: `{ cloze: "Nie wiem ___.", englishMissingPart: "what to say", rightAnswer: "co powiedzieć" }`,
	ru: `{ cloze: "Я не знаю ___.", englishMissingPart: "what to say", rightAnswer: "что сказать" }`,
	nl: `{ cloze: "Ik weet niet ___.", englishMissingPart: "what to say", rightAnswer: "wat te zeggen" }`,
	fr: `{ cloze: "Je ne sais pas ___.", englishMissingPart: "what to say", rightAnswer: "quoi dire" }`,
	sv: `{ cloze: "Jag vet inte ___.", englishMissingPart: "what to say", rightAnswer: "vad jag ska säga" }`
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
			Reason about what how the exercises should be structured and useful words or phrases (in "structure"), then return the exercises. Prefer simple words.`
		}),
		model: 'claude-3-5-sonnet-20240620',
		temperature: 1,
		schema: z.object({
			exercises: z.array(
				z.object({
					cloze: z.string(),
					englishMissingPart: z.string(),
					rightAnswer: z.string()
				})
			)
		}),
		logResponse: true
	});
}
