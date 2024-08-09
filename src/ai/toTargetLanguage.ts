import { Language } from '../logic/types';
import { ask } from './ask';

export function toTargetLanguage(
	sentenceString: string,
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
					`The user will enter a sentence. Translate it to ${language.name} or if it is not already in ${language.name}. ` +
					`If the sentence contains any gross grammatical errors, correct them. ` +
					`Replace any proper nouns (e.g. iPhone, McDonalds) with generic terms. ` +
					`Print only the updated sentence; nothing else.`
			},
			{
				role: 'user',
				content: sentenceString
			}
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 0.5,
		logResponse: true
	});
}
