import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { openai } from "./client";
import { z } from "zod";

export async function getExampleSentences(lemma: string) {
	console.log(`Getting example sentences for ${lemma}...`)

	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: (
			[
				{
					role: 'system',
					content: `Print six Polish sentences illustrating the use of the entered word as JSON object with the key examples containing the sentences as an array.`
				}
			] as ChatCompletionMessageParam[]
		).concat({ role: 'user', content: lemma }),
		temperature: 1,
		max_tokens: 1000,
		response_format: { type: 'json_object' }
	});

	const response = completion.choices[0].message.content;

	try {
		return z.object({ examples: z.array(z.string()) }).parse(JSON.parse(response!)).examples;
	} catch (e: any) {
		throw new Error(`Error parsing response "${response}"`);
	}
}
