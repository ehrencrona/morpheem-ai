import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

export async function evaluateCloze(
	{
		cloze,
		clue,
		userAnswer,
		correctAnswer,
		isRightLemma
	}: {
		cloze: string;
		clue: string;
		userAnswer: string;
		correctAnswer: { word: string; conjugated: string };
		isRightLemma: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
) {
	return await askForJson({
		messages: [
			{
				role: 'system',
				content:
					`I am a ${language.name} learner trying to solve a cloze exercise; you are a helpful teacher giving me feedback.\n\n` +
					`The expected answer is "${correctAnswer.conjugated}".\n` +
					(isRightLemma
						? `Very briefly explain how the required grammatical form/inflection relates to the one I picked and why it is right or wrong. Return the case "correct" or "wrongForm". Return JSON in the form \`{ evaluation: string, case: string }\``
						: `If my answer is incorrect, tell me if the problem is grammatical agreement, spelling or wrong meaning. If it is grammatical agreement, explain the forms involved and why the correct one is correct. If it is wrong meaning, explaing the meaning of the word I chose. Return the explanation in "evaluation".

						The determine the first of these cases that applies: 
						 - "wrongForm": My answer is a different grammatical form of "${correctAnswer.word}".
						 - "alternate": My answer works logically and the sentence is grammatically correct. 
						 - "alternateWrongForm": My answer would work if it were not in the wrong form. Return the correct form in the "corrected" field.
						 - "typo": My answer is the correct answer but has a misspelling.
						 - "wrong": My answer is not possible.
						
						I will be shown the right answer so no need to repeat it. Also no need to repeat my answer. 
						
						Return JSON in the form \`{ evaluation: string, case: string, corrected?: string }\``)
			},
			{
				role: 'assistant',
				content: `Find the missing word:\n\n${cloze.replace(/_+/, `_______ ("${clue}")`)}\n\n`
			},
			{ role: 'user', content: cloze.replace(/_+/, `***` + userAnswer + `***`) }
		],
		model: 'gpt-4o',
		temperature: 0.5,
		logResponse: true,
		schema: z.object({
			evaluation: z.string(),
			case: z.enum(['correct', 'wrongForm', 'typo', 'alternate', 'alternateWrongForm', 'wrong']),
			corrected: z.string().optional()
		})
	});
}
