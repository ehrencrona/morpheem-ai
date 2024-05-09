import type { z } from 'zod';
import { Message, ask } from './ask';
import { zodParse } from './zodParse';

const defaultModel = 'llama3-8b-8192';

export async function askForJson<T>({
	instruction,
	messages,
	temperature,
	max_tokens,
	schema,
	model = defaultModel,
	retriesLeft = 1
}: {
	instruction?: string;
	messages: Message[];
	temperature: number;
	max_tokens: number;
	schema: z.ZodType<T, any>;
	model?:
		| 'gpt-3.5-turbo'
		| 'gpt-4-turbo'
		| 'llama3-8b-8192'
		| 'llama3-70b-8192'
		| 'mixtral-8x7b-32768';
	retriesLeft?: number;
}) {
	const response = await ask({
		messages,
		model,
		format: 'json_object',
		temperature,
		max_tokens
	});

	try {
		return zodParse(response!, schema);
	} catch (error) {
		const message = `Failed to parse response: ${error}\nResponse: ${response}\nPrompt: ${prompt}\nInstruction: ${instruction}`;

		if (retriesLeft > 0) {
			console.error(`${message}. Retrying...`);

			return askForJson({
				instruction,
				messages,
				temperature: temperature + (1 - temperature) / 2,
				max_tokens,
				schema,
				model,
				retriesLeft: retriesLeft - 1
			});
		} else {
			throw new Error(message);
		}
	}
}
