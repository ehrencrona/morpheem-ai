import { ask } from './ask';

export async function generateHint(sentence: string) {
	return ask({
		temperature: 1,
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content: `Continue the entered sentence. Write one more sentence. Write nothing else.`
			},
			{
				role: 'user',
				content: sentence
			}
		]
	});
}
