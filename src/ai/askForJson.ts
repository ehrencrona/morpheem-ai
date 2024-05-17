import type { z } from 'zod';
import { Message, Model, ask } from './ask';
import { zodParse } from './zodParse';

const defaultModel = 'llama3-8b-8192';

export async function askForJson<T>({
	instruction,
	messages,
	temperature,
	max_tokens,
	schema,
	model = defaultModel,
	retriesLeft = 1,
	logResponse = false
}: {
	instruction?: string;
	messages: Message[];
	temperature: number;
	max_tokens?: number;
	schema: z.ZodType<T, any>;
	model?: Model;
	retriesLeft?: number;
	logResponse?: boolean;
}) {
	const response = await ask({
		messages,
		model,
		format: 'json_object',
		temperature,
		max_tokens,
		logResponse
	});

	try {
		return zodParse(response!, schema);
	} catch (error) {
		const message = `Failed to parse response: ${error}\nResponse: ${response}\nPrompt: ${messages.map(({ content }) => content).join(', ')}\nInstruction: ${instruction}`;

		if (retriesLeft > 0) {
			console.error(`${message}. Retrying...`);

			return askForJson({
				instruction,
				messages,
				temperature: temperature + (1 - temperature) / 2,
				max_tokens,
				schema,
				model,
				retriesLeft: retriesLeft - 1,
				logResponse
			});
		} else {
			throw new Error(message);
		}
	}
}
