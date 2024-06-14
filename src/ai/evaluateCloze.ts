import { Language } from '../logic/types';
import { ask } from './ask';

const POSSIBLE_ANSWER_STRING = 'This is a possible answer.';

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
	const message = await ask({
		messages: [
			{
				role: 'system',
				content:
					`The user is solving the following ${language.name} cloze exercise:\n\n${cloze}\n\n` +
					`We were looking for the right answer "${correctAnswer}". The clue "${clue}" was provided.\n` +
					(isWrongInflection
						? `Very briefly explain which grammatical form of the word is required and why. Also explain what form the user picked. Address the user as "you."\n`
						: `If the user's answer is similar to the right answer, very briefly explain their relationship in terms of meaning or grammar.\n` +
							`Otherwise, briefly explain the meaning of the word the user chose.\n` +
							`If the user chose an answer that is possible in the cloze, finish with "${POSSIBLE_ANSWER_STRING}"\n`) +
					`Answer nothing else:\n`
			},
			{ role: 'user', content: userAnswer }
		],
		model: 'gpt-4o',
		temperature: 0.5,
		logResponse: true
	});

	return {
		message,
		isPossible: message.includes(POSSIBLE_ANSWER_STRING)
	};
}
