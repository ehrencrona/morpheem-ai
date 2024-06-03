import { Language } from '../logic/types';
import { ask } from './ask';

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
		correctAnswer: string;
		isWrongInflection: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
) {
	return ask({
		messages: [
			{
				role: 'system',
				content:
					`The user is solving the following ${language.name} cloze exercise:\n\n${cloze}\n\n` +
					`The correct answer is "${correctAnswer}". The clue "${clue}" was provided.\n` +
					(isWrongInflection
						? `Very briefly explain which grammatical form of the word is required and why. Also explain what form the user picked. Address the user as "you."\n`
						: `The user is allowed to answer with the dictionary form of the word.\n` +
							`1. If the answer is similar to the right answer, very briefly explain their relationship in terms of meaning or grammar.\n` +
							`2. Otherwise, briefly explain the meaning of word given as answer.\n`) +
					`Answer nothing else:\n`
			},
			{ role: 'user', content: userAnswer }
		],
		model: 'gpt-4o',
		temperature: 0.5,
		logResponse: true
	});
}
