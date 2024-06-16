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
	return await askForJson({
		messages: [
			{
				role: 'system',
				content:
					`The user is solving the following ${language.name} cloze exercise:\n\n${cloze}\n\n` +
					`We are looking for the right answer "${correctAnswer.conjugated}". The clue "${clue}" was provided.\n` +
					(isWrongInflection
						? `Very briefly explain which grammatical form of the word is required and why. Also explain what form the user picked. Address the user as "you.". Return JSON in the form { evaluation: string }\n`
						: `Very briefly explain to the user the relationship between the provided and expected answer in terms of meaning or grammar.\n` +
							`Explain which of the following is the case:\n` +
							` - The word is correct but a typo.\n` +
							` - The word is unexpected but still possible in the sentence. But is it in the correct grammatical form (isCorrectInflection)?\n` +
							`The user will be shown the right answer so no need to repeat it. \n` +
							`Return JSON in the form { evaluation: string, isPossibleWord: boolean, isCorrectInflection: boolean, userWordWithTypoCorrected: string }\n`)
			},
			{ role: 'user', content: cloze.replace(/_+/, `***` + userAnswer + `***`) }
		],
		model: 'gpt-4o',
		temperature: 0.5,
		logResponse: true,
		schema: z.object({
			evaluation: z.string(),
			isPossibleWord: z.boolean().optional(),
			isCorrectInflection: z.boolean().optional(),
			userWordWithTypoCorrected: z.string().optional()
		})
	});
}
