import { Language } from '../logic/types';
import { Message, ask } from './ask';

export async function askMeAnythingWrite({
	exercise,
	sentence,
	sentenceEntered,
	sentenceCorrected,
	correctTranslation,
	word,
	question,
	language
}: {
	exercise: 'write' | 'translate';
	sentence?: string;
	sentenceEntered?: string;
	sentenceCorrected?: string;
	correctTranslation?: string;
	word?: string;
	question: string;
	language: Language;
}) {
	return ask({
		model: 'claude-3-5-sonnet-20240620',
		messages: [
			{
				role: 'system',
				content: `${exercise == 'translate' ? `The expected answer to the exercise is "${correctTranslation}"` : ''} If I wrote an English word or phrase, provide the ${language.name} translation. Do not provide the whole sentence for me (unless explicitly asked for).`
			},
			{
				role: 'user',
				content: `${
					exercise == 'translate'
						? `I am studying ${language.name} and translating the sentence "${sentence}" as an exercise.`
						: `I am practicing writing in ${language.name} and writing a sentence or fragment containing "${word}" as an exercise`
				}.

				${sentenceEntered?.trim() ? `So far I've come up with "${sentenceEntered}"` : ''}`
			} as Message,
			{
				role: 'assistant',
				content: sentenceCorrected?.trim()
					? `I corrected your sentence. It should read "${sentenceCorrected}"`
					: 'What is your question?'
			} as Message,
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
	confusedWord,
	unknown,
	language
}: {
	question: string;
	sentence: string;
	translation?: string;
	word?: string;
	confusedWord?: string;
	unknown: { english: string; word: string }[];
	language: Language;
}) {
	return ask({
		model: 'claude-3-5-sonnet-20240620',
		messages: [
			{
				role: 'system',
				content:
					`The user is studying ${language.name} and encountered the sentence "${sentence}"${word ? ` while studying the word "${word}"` : ''}${confusedWord ? ` which they confused with "${confusedWord}"` : ''}. ` +
					`The user now has a question (about ${language.name}, the sentence or the word${confusedWord ? 's' : ''}). ` +
					`Briefly but helpfully and friendly answer the question (in English). The English translation of the sentence has been shown; no need to repeat it.`
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
			...unknown
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

export async function findProvidedWordsInAnswer(
	question: string,
	answer: string,
	language: Language
) {
	const wordString = await ask({
		model: 'claude-3-5-sonnet-20240620',
		messages: [
			{
				role: 'system',
				content:
					`The user is studying ${language.name} and asked a question. We want to track which words the user didn't know, so list any ${language.name} words that the user asked for and was provided with. ` +
					`The user can enter an English phrase to get it translated; this counts as asking. ` +
					`If the user did not ask for any words (e.g. they asked a grammar question), just answer with an empty string. Use the dictionary form (lemma). Only list the words, separated by commas.`
			},
			{
				role: 'user',
				content: question
			},
			{
				role: 'assistant',
				content: answer
			}
		],
		temperature: 0,
		logResponse: true
	});

	return wordString
		.split(', ')
		.map((word) => word.trim().replace(/"/g, ''))
		.filter(Boolean)
		.filter((word) => !word.includes(' '));
}
