import { z } from 'zod';
import { Language } from '../logic/types';
import { askForJson } from './askForJson';

export async function findIncorrectSentences(
	sentences: {
		sentence: string;
		id: number;
	}[],
	language: Language
): Promise<number[]> {
	const res = await askForJson({
		messages: [
			{
				role: 'system',
				content: `Are there any grammatical errors in these ${language.name} sentences or are any of them illogical or in the wrong language? Return an evaluation and a list of any sentences that are incorrect as JSON in the form: { evaluation: string, incorrectSentenceIds: number[] }`
			},
			{
				role: 'user',
				content: sentences.map((sentence) => `${sentence.id}) ${sentence.sentence}`).join('\n')
			}
		],
		temperature: 0.6,
		logResponse: false,
		logRequest: false,
		schema: z.object({
			evaluation: z.string(),
			incorrectSentenceIds: z.array(z.number())
		})
	});

	return res.incorrectSentenceIds;
}
