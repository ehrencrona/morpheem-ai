import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import type { ChatCompletion } from 'openai/src/resources/index.js';
import type { z } from 'zod';
import { openai } from './client';
import { zodParse } from './zodParse';

export async function promptForJson<T>({
	instruction,
	prompt,
	temperature,
	max_tokens,
	schema
}: {
	instruction: string;
	prompt: string;
	temperature: number;
	max_tokens: number;
	schema: z.ZodType<T, any>;
}) {
	let completion: ChatCompletion;

	try {
		completion = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: (
				[
					{
						role: 'system',
						content: instruction
					}
				] as ChatCompletionMessageParam[]
			).concat({
				role: 'user',
				content: prompt
			}),
			response_format: { type: 'json_object' },
			temperature,
			max_tokens
		});
	} catch (error) {
		throw new Error(
			`Failed to prompt for JSON: ${error}\nPrompt: ${prompt}\nInstruction: ${instruction}`
		);
	}

	const choice = completion.choices[0];

	if (choice.finish_reason === 'length') {
		throw new Error(
			`Too long response: ${choice.message.content}\nPrompt: ${prompt}\nInstruction: ${instruction}\nmaxTokens: ${max_tokens}`
		);
	}

	const response = choice.message.content;

	return zodParse(response!, schema);
}
