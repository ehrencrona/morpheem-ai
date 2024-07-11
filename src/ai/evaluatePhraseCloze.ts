import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

export interface PhraseEvaluation {
	answered: string;
	outcome: 'correct' | 'typo' | 'alternate' | 'wrong';
	evaluation?: string;
	correctedAlternate?: string;
}

export async function evaluatePhraseCloze(
	{
		cloze,
		hint,
		answered,
		correctAnswer
	}: {
		cloze: string;
		hint: string;
		answered: string;
		correctAnswer: string;
	},
	{
		language
	}: {
		language: Language;
	}
): Promise<PhraseEvaluation> {
	const result = await askForJson({
		messages: [
			{
				role: 'system',
				content:
					`I am a ${language.name} learner trying to solve the following cloze exercise; you are a helpful teacher giving me feedback.\n\n` +
					`Find the missing words:\n\n${cloze.replace(/_+/, `_______ ("${hint}")`)}\n\n` +
					`The expected answer is "${correctAnswer}", but other answers might be possible. Do not make assumptions about gender, formality level etc, if they cannot be inferred from the context. \n` +
					`If my answer is incorrect, determine if the problem is grammatical agreement, spelling or wrong meaning. ` +
					`If it is grammatical agreement, explain which form I chose, the correct form and why the correct one should be preferred. Use grammatical terminology. ` +
					`If it is wrong meaning, explain the meaning of the words I entered. Return the explanation in "evaluation".

						Then determine the first of these cases that applies: 
             - "correct": My answer is the answer we are looking for.
						 - "alternate": My answer works logically and the sentence is grammatically correct. 
						 - "typo": My answer is the correct answer but has a misspelling.
						 - "wrong": My answer is not possible.
						
						I will be shown the right answer so no need to repeat it. Also no need to repeat my answer. 
						
						Return JSON in the form \`{ evaluation: string, case: string, corrected?: string }\``
			},
			{ role: 'user', content: cloze.replace(/_+/, `***` + answered + `***`) }
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 0.5,
		logResponse: true,
		schema: z.object({
			evaluation: z.string(),
			case: z.enum(['correct', 'typo', 'alternate', 'wrong']),
			corrected: z.string().optional()
		})
	});

	return {
		answered,
		outcome: result.case,
		evaluation: result.evaluation,
		correctedAlternate: result.corrected
	};
}
