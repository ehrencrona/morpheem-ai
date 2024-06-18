import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

export async function evaluateCloze(
	{
		cloze,
		clue,
		userAnswer,
		correctAnswer,
		isWrongInflection
	}: {
		cloze: string;
		clue: string;
		userAnswer: string;
		correctAnswer: { conjugated: string };
		isWrongInflection: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
) {
	const examples: Record<string, string> = {
		pl: ' (e.g. perfective/imperfective, case)'
	};

	return await askForJson({
		messages: [
			{
				role: 'system',
				content:
					`I am a ${language.name} learner trying to solve a cloze exercise; you are a helpful teacher giving me feedback.\n\n` +
					`The expected answer is "${correctAnswer.conjugated}".\n` +
					(isWrongInflection
						? `Very briefly explain which grammatical form of the word is required and why. Also explain what form I picked. Return JSON in the form \`{ shortEvaluation: string }\``
						: `Evaluate whether whether my answer is logically possible, what the expected grammatical form is and what grammatical form my answer is in${examples[language.code] || ''}.

						Then summarize it into a short evaluation. The following cases exist: 
						 - My answer is correct but a typo. If so, briefly explain the typo and return the corrected word in \`corrected\`.
						 - My answer is possible: the word I chose works logically and structurally in the sentence. 
						   If I choose a possible word (\`isPossibleWord\`) but the wrong form of it (\`!isCorrectInflection\`), explain the grammatical forms involved and return the right form in \`corrected\`.
						 - My answer is wrong. Explain when to use the word I chose.
						
						I will be shown the right answer so no need to repeat it. Also no need to repeat my answer. 
						
						Return JSON in the form \`{ longEvaluation: string, shortEvaluation: string, isPossibleWord: boolean, isCorrectInflection: boolean, corrected?: string }\``)
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
			shortEvaluation: z.string(),
			isPossibleWord: z.boolean().optional(),
			isCorrectInflection: z.boolean().optional(),
			corrected: z.string().optional()
		})
	});
}
