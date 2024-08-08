import type { z } from 'zod';
import { Message, Model, ask } from './ask';
import { zodParse } from './zodParse';

export async function askForJson<T>({
	messages,
	temperature,
	max_tokens,
	schema,
	model,
	retriesLeft = 0,
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
	let response = await ask({
		// https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response
		messages: [
			...messages,
			{
				role: 'assistant',
				content: '{'
			}
		],
		model,
		format: 'json_object',
		temperature,
		max_tokens,
		logRequest,
		logResponse
	});

	if (!response.trim().startsWith('{')) {
		response = '{' + response;
	}

	// either the newlines are between attributes, in which case they are redudant, or they are within an attribute, in which case they are not allowed
	response = response.replaceAll('\n', ' ');

	try {
		return zodParse(response, schema);
	} catch (error) {
		const message = `Failed to parse response: ${error}\nResponse: ${response.replace(/\n/g, '\\n')}`;

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
