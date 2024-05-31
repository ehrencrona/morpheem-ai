import { groq } from './groq-client';
import { openai } from './openai-client';

export type Model =
	| 'gpt-3.5-turbo'
	| 'gpt-4o'
	| 'llama3-8b-8192'
	| 'llama3-70b-8192'
	| 'mixtral-8x7b-32768';

export interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

let requestCount = 0;

const defaultModel = 'gpt-4o';

export async function ask<T>({
	messages,
	temperature,
	max_tokens,
	model = defaultModel,
	retriesLeft = 2,
	format = 'text',
	logResponse = false
}: {
	messages: Message[];
	temperature: number;
	max_tokens?: number;
	retriesLeft?: number;
	model?: Model;
	format?: 'json_object' | 'text';
	logResponse?: boolean;
}) {
	let completion;

	const requestId = requestCount++;

	console.debug(
		messages
			.map(
				(message) =>
					`${requestId}. [${message.role}] ${message.content.replaceAll(/[\n\t ]+/g, ' ')}`
			)
			.join('\n')
	);

	const params = {
		messages,
		response_format: format ? { type: format } : undefined,
		temperature,
		max_tokens
	};

	try {
		if (['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'].includes(model)) {
			completion = await groq.chat.completions.create({
				model,
				...params
			});
		} else {
			completion = await openai.chat.completions.create({
				model,
				...params
			});
		}

		const choice = completion.choices[0];

		if (choice.finish_reason === 'length') {
			throw new Error(
				`Too long response: ${choice.message.content}\n${messages.map((message) => `[${message.role}] ${message.content}`).join('\n')}`
			);
		}

		const response = completion.choices[0].message.content || '';

		if (logResponse) {
			console.debug(`${requestId}. [${model}] ${response?.replaceAll(/[\n\t ]+/g, ' ')}`);
		}

		return response;
	} catch (error) {
		const message = `Failed to prompt for ${format}: ${error}\n${messages.map((message) => `[${message.role}] ${message.content}`).join('\n')}`;

		if (retriesLeft > 0) {
			console.error(message + ' Retrying...');

			return ask({
				messages,
				temperature: temperature + (1 - temperature) / 2,
				max_tokens,
				retriesLeft: retriesLeft - 1
			});
		} else {
			throw new Error(message);
		}
	}
}

export function toMessages({
	instruction,
	prompt
}: {
	instruction?: string;
	prompt: string;
}): Message[] {
	return [
		{ role: 'system', content: instruction || '' },
		{ role: 'user', content: prompt }
	];
}
