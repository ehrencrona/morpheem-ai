import { z } from 'zod';
import { askForJson } from './askForJson';
import { Message, ask } from './ask';

const responseSchema = z.object({
	feedback: z.string(),
	corrected: z.string()
});

export async function generateWritingFeedback(
	sentence: string,
	word: string
): Promise<z.infer<typeof responseSchema>> {
	return askForJson({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					'Briefly but friendly point out any errors in the Polish text entered by the user. If there are grammatical mistakes, spelling mistakes, unidiomatic constructs or inappropriate word choices, point them out. If the sentence is correct, praise the user. Also return the corrected text, applying all your suggestions. Return JSON in the format {feedback: string, corrected: string}'
			},
			{
				role: 'assistant',
				content: `Write a Polish sentence or fragment containing "${word}"`
			},
			{
				role: 'user',
				content: sentence
			}
		],
		temperature: 1,
		logResponse: true,
		schema: responseSchema
	});
}

export async function askMeAnything({
	sentence,
	word,
	question
}: {
	sentence?: string;
	word: string;
	question: string;
}) {
	return ask({
		model: 'gpt-4o',
		messages: [
			{
				role: 'system',
				content:
					'The user needs help formulating a Polish sentence. Briefly but helpfully and friendly answer the question. If the user wrote an English word, provide the Polish translation.'
			},
			{
				role: 'assistant',
				content: `Write a Polish sentence or fragment containing "${word}"`
			},
			...(sentence?.trim()
				? ([
						{
							role: 'user',
							content: sentence
						}
					] as Message[])
				: []),
			{ role: 'user', content: question }
		],
		temperature: 1,
		logResponse: true
	});
}
