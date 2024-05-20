import { languagesSpoken } from '../logic/user';
import { Message, ask } from './ask';

export async function askMeAnythingWrite({
	sentenceEntered,
	sentenceCorrected,
	word,
	question
}: {
	sentenceEntered?: string;
	sentenceCorrected?: string;
	word: string;
	question: string;
}) {
	return ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					'The user is practicing writing in Polish. Briefly but helpfully and friendly answer the question in English. If the user wrote an English word, provide the Polish translation. Do not provide the whole sentence for the user (unless explicitly asked for).'
			},
			{
				role: 'assistant',
				content: `Write a Polish sentence or fragment containing "${word}"`
			},
			...(sentenceEntered?.trim()
				? ([
						{
							role: 'user',
							content: sentenceEntered
						}
					] as Message[])
				: []),
			...(sentenceCorrected?.trim()
				? ([
						{
							role: 'assistant',
							content: `I corrected your sentence. It should read "${sentenceCorrected}"`
						}
					] as Message[])
				: []),
			{ role: 'user', content: question }
		],
		temperature: 1,
		logResponse: true
	});
}

export async function askMeAnythingRead({
	question,
	sentence,
	translation,
	word,
	revealed
}: {
	question: string;
	sentence: string;
	translation?: string;
	word: string;
	revealed: { english: string; word: string }[];
}) {
	return ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content: `The user is studying Polish and found the sentence "${sentence}" while studying the word ${word} and has a question. Briefly but helpfully and friendly answer the question in English.`
			},
			{
				role: 'system',
				content: `The user speaks the following languages: ${languagesSpoken}`
			},
			...(translation
				? ([
						{
							role: 'user',
							content: `What does the sentence mean?`
						},
						{
							role: 'assistant',
							content: `"${translation}"`
						}
					] as Message[])
				: []),
			...revealed
				.map(
					({ word, english }) =>
						[
							{
								role: 'user',
								content: `What does "${word} mean"?`
							},
							{
								role: 'assistant',
								content: `"${english}"`
							}
						] as Message[]
				)
				.flat(),
			{
				role: 'user',
				content: question
			}
		],
		temperature: 1,
		logResponse: true
	});
}
