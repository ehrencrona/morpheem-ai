import type { z } from 'zod';
import { Message, Model, ask } from './ask';
import { zodParse } from './zodParse';

export async function askForJson<T>({
	messages,
	temperature,
	max_tokens,
	schema,
	model,
	retriesLeft = 1,
	logResponse,
	logRequest
}: {
	messages: Message[];
	temperature: number;
	max_tokens?: number;
	schema: z.ZodType<T, any>;
	model?: Model;
	retriesLeft?: number;
	logResponse?: boolean;
	logRequest?: boolean;
}) {
	const response = await ask({
		messages,
		model,
		format: 'json_object',
		temperature,
		max_tokens,
		logRequest,
		logResponse
	});

	try {
		return zodParse(response!, schema);
	} catch (error) {
		const message = `Failed to parse response: ${error}\nResponse: ${response}\nPrompt: ${messages.map(({ content }) => content).join(', ')}`;

		if (retriesLeft > 0) {
			console.error(`${message}. Retrying...`);

			return askForJson({
				messages,
				temperature: temperature + (1 - temperature) / 2,
				max_tokens,
				schema,
				model,
				retriesLeft: retriesLeft - 1,
				logRequest,
				logResponse
			});
		} else {
			throw new Error(message);
		}
	}
}
