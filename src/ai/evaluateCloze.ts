import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

export async function evaluateCloze(
	{
		cloze,
		hint,
		answered,
		correctAnswer,
		isRightLemma
	}: {
		cloze: string;
		hint: string;
		answered: string;
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
					`I am a ${language.name} learner trying to solve the following cloze exercise; you are a helpful teacher giving me feedback:\n\n` +
					`Find the missing word:\n\n${cloze.replace(/_+/, `_______ ("${hint}")`)}\n\n` +
					`The expected answer is "${correctAnswer.conjugated}", but other answers might be possible. Do not make assumptions about gender, formality level etc, if they cannot be inferred from the context. \n` +
					(isRightLemma
						? `Very briefly explain how the required grammatical form/inflection relates to the one I picked and why it is right or wrong in the field "evaluation". In "case", return "correct" or "wrongForm". Return JSON in the form \`{ evaluation: string, case: string }\``
						: `First consider if the answer given is grammatically correct and fits the hint. ` +
							(language.code == 'ko'
								? `I might have used a different formality level than expected; that is fine if it still works in the context. `
								: '') +
							`If my answer is incorrect, determine if the problem is grammatical agreement, spelling or wrong meaning. ` +
							`If it is grammatical agreement, explain which form I chose, the correct form and why the correct one should be preferred. Use grammatical terminology. ` +
							`If it is wrong meaning, explain the meaning of the word I chose. Return the explanation in "evaluation".

						Then determine the first of these cases that applies: 
						 - "wrongForm": My answer is a different grammatical form of "${correctAnswer.word}".
						 - "alternate": My answer works logically and the sentence is grammatically correct. 
						 - "alternateWrongForm": My answer would work, but is in the wrong form. Return the correct form in the "corrected" field.
						 - "typo": My answer is correct but is a misspelling.
						 - "wrong": My answer is not possible.
						
						I will be shown the right answer so no need to repeat it. Also no need to repeat my answer. 
						
						Return JSON in the form \`{ evaluation: string, case: string, corrected?: string }\``)
			},
			{ role: 'user', content: cloze.replace(/_+/, `***` + answered + `***`) }
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 0.5,
		logResponse: true,
		schema: z.object({
			evaluation: z.string(),
			case: z.enum(['correct', 'wrongForm', 'typo', 'alternate', 'alternateWrongForm', 'wrong']),
			corrected: z.string().optional()
		})
	});
}
