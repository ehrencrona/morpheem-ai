import { groq } from './groq-client';
import { openai } from './openai-client';
import { anthropic } from './anthropic-client';
import { error } from '@sveltejs/kit';

export type Model =
	| 'gpt-4o-mini'
	| 'gpt-4o'
	| 'llama3-8b-8192'
	| 'llama3-70b-8192'
	| 'mixtral-8x7b-32768'
	| 'claude-3-5-sonnet-20240620';

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
	logRequest = true,
	logResponse = false
}: {
	messages: Message[];
	temperature: number;
	max_tokens?: number;
	retriesLeft?: number;
	model?: Model;
	format?: 'json_object' | 'text';
	logRequest?: boolean;
	logResponse?: boolean;
}) {
	let completion;

	const requestId = requestCount++;

	if (logRequest) {
		console.debug(
			messages
				.map(
					(message) =>
						`${requestId}. [${message.role}] ${message.content.replaceAll(/[\n\t ]+/g, ' ')}`
				)
				.join('\n')
		);
	}

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
		} else if (model == 'claude-3-5-sonnet-20240620') {
			const message = await anthropic.messages.create({
				temperature,
				max_tokens: max_tokens || 4096,
				model,
				system: messages.find(({ role }) => role === 'system')?.content,
				messages: messages.filter(({ role }) => role != 'system') as {
					role: 'user' | 'assistant';
					content: string;
				}[]
			});

			if (message.content.length == 0) {
				return '';
			}

			const content = message.content[0];

			if (content.type == 'text') {
				if (message.stop_reason == 'max_tokens') {
					throw new Error(
						`Too long response: ${content.text}\n${messages.map((message) => `[${message.role}] ${message.content}`).join('\n')}`
					);
				}

				if (logResponse) {
					console.debug(
						`${requestId}. [${model}] ${content.text.replaceAll(/\n/g, '\\n').replaceAll(/[\n\t ]+/g, ' ')}`
					);
				}

				return content.text;
			} else {
				throw new Error(`Unexpected response type: ${JSON.stringify(content)}`);
			}
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
	} catch (e) {
		const message = `${requestId}. Failed to prompt for ${format}: ${e}`;

		let isOverloaded = message.includes('529');

		if (retriesLeft > 0) {
			console.error(message + ' Retrying...');

			if (isOverloaded) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			return ask({
				model,
				messages,
				temperature: temperature + (1 - temperature) / 2,
				max_tokens,
				retriesLeft: retriesLeft - 1
			});
		} else {
			throw error(isOverloaded ? 529 : 502, message);
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
