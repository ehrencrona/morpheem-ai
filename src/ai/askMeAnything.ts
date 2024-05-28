import { Language } from '../logic/types';
import { Message, ask } from './ask';

export async function askMeAnythingWrite({
	sentenceEntered,
	sentenceCorrected,
	word,
	question,
	languagesSpoken,
	language
}: {
	sentenceEntered?: string;
	sentenceCorrected?: string;
	word: string;
	question: string;
	languagesSpoken: string;
	language: Language;
}) {
	return ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content: `The user is practicing writing in ${language.name}. Briefly but helpfully and friendly answer the question in English. If the user wrote an English word or phrase, provide the ${language.name} translation. Do not provide the whole sentence for the user (unless explicitly asked for).`
			},
			{
				role: 'system',
				content: `The user speaks the following languages: ${languagesSpoken}`
			},
			{
				role: 'assistant',
				content: `Write a ${language.name} sentence or fragment containing "${word}"`
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
	confusedWord,
	revealed,
	languagesSpoken,
	language
}: {
	question: string;
	sentence: string;
	translation?: string;
	word: string;
	confusedWord?: string;
	revealed: { english: string; word: string }[];
	languagesSpoken: string;
	language: Language;
}) {
	return ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content: `The user is studying ${language.name} and encountered the sentence "${sentence}" while studying the word ${word}${confusedWord ? `which they confused with "${confusedWord}"` : ''}. The user now has a question (about ${language.name}, the sentence or the word${confusedWord ? 's' : ''}). Briefly but helpfully and friendly answer the question (in English).`
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

export async function findProvidedWordsInAnswer(
	question: string,
	answer: string,
	language: Language
) {
	const examples = {
		pl:
			'Q: "How do you say white cats?" A: "białe koty" -> "biały, kot"\n' +
			'Q: "How is mowic conjugated with oni?" A: "mówią" -> "" (because mówic was in the question)\n' +
			'Q: "Give it to me?" A: "daj mi to" -> "daċ, mi, to"\n',
		fr:
			'Q: "How do you say white cats?" A: "chats blancs" -> "chat, blanc"\n' +
			'Q: "How is parler conjugated with ils?" A: "parlent" -> "" (because parler was in the question)\n' +
			'Q: "Give it to me?" A: "donne le moi" -> "donner, le, moi"\n'
	};

	const wordString = await ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					`In the following question/answer pair, I want to find which ${language.name} words the user were told about that they did not already know. List all ${language.name} words in the answer that are not present in the question. Use the dictionary form (lemma). Ignore English words. Only list the words, separated by commas.\n` +
					'For example:\n' +
					examples[language.code]
			},
			{
				role: 'user',
				content: `Q: "${question}" A: "${answer}"`
			}
		],
		temperature: 0,
		logResponse: true
	});

	return wordString.split(', ').map((word) => word.trim().replace(/"/g, ''));
}
