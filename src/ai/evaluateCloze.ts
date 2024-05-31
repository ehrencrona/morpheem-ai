import { Language } from '../logic/types';
import { ask } from './ask';

export async function evaluateCloze(
	{
		cloze,
		clue,
		userAnswer,
		correctAnswer
	}: {
		cloze: string;
		clue: string;
		userAnswer: string;
		correctAnswer: string;
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
					`The user does not have to answer with the correct inflection; the dictionary form is fine.\n` +
					`1. If the answer is similar to the right answer, very briefly explain their relationship in terms of meaning or grammar.\n` +
					`2. Otherwise, briefly explain the meaning of word given as answer.\n` +
					`Answer nothing else:\n`
			},
			{ role: 'user', content: userAnswer }
		],
		model: 'gpt-4o',
		temperature: 0.5,
		logResponse: true
	});
}
