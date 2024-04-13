import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { openai } from "./client";
import { toWords } from "../logic/toWords";

export async function sentencesToLemmas(sentences: string[]) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: (
			[
				{
					role: 'system',
					content: `For every Polish word entered, print it followed by the dictionary form. Print nothing else. Ignore punctuation.
					Example:

"to są przykłady" 

becomes 
					
to: to
są: jest
przykłady: przykład`
				}
			] as ChatCompletionMessageParam[]
		).concat({ role: 'user', content: sentences.join('\n') }),
		temperature: 0,
		max_tokens: 1000
	});

	const response = completion.choices[0].message.content;

	const standardize = (word: string) => word.toLowerCase();

	let lemmaByWord: Record<string, string> = {};

	(response || '').split('\n').map((line) => {
		let [word, lemma] = line.split(':').map((part) => part.trim());

		if (word && lemma) {
			word = standardize(word);
			lemma = standardize(lemma);

			lemmaByWord[word] = lemma;
		}
	});

	return sentences.map((sentence) =>
		toWords(sentence).map((word) => lemmaByWord[standardize(word)] || word)
	);
}
