import * as DB from '../db/types';
import { toWords } from '../logic/toWords';
import { ask } from './ask';

export async function isContextProvided(sentence: string, word: DB.Word, lemmas: string[]) {
	const wordStrings = toWords(sentence);

	if (wordStrings.length !== lemmas.length) {
		throw new Error(`Word count mismatch: ${wordStrings.length} !== ${lemmas.length}`);
	}

	const index = lemmas.indexOf(word.word);

	const wordString = wordStrings[index];

	const maskedSentence = sentence.replaceAll(wordString, '____');

	const response = await ask({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: 'Print the 4-8 most likely completions separated by commas. Print nothing else.'
			},
			{
				role: 'user',
				content: `What is the missing word in the following Polish sentence?\n${maskedSentence}`
			}
		],
		temperature: 1,
		logResponse: true
	});

	return response!.toLowerCase().includes(wordString);
}
