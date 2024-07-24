import { filterUndefineds } from '$lib/filterUndefineds';
import { Language } from '../logic/types';
import { ask } from './ask';

export async function findInvalidSentences(sentences: string[], language: Language) {
	const res = await ask({
		messages: [
			{
				role: 'user',
				content:
					`Go through these ${language.name} sentences, one per line, and evaluate if it is grammatically correct and makes logical sense (in the sense of: could you actually use this sentence in real life).\n` +
					`Repeat the sentence back to me with the initial number, and then add " -- correct" on the same line if it is correct, or " -- incorrect" if it is incorrect. Do not write anything else\n\n` +
					`Sentences:\n` +
					`${sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
			}
		],
		model: 'gpt-4o',
		temperature: 0.3
	});

	return filterUndefineds(
		res
			.split('\n')
			.filter((m) => m.match(/ -- incorrect$/))
			.map((m) => m.replace(/^ +- /, ''))
			.map((m) => m.split(' -- incorrect')[0])
			.map((invalid) => {
				const number = invalid.match(/^\d+\. /)?.[0];

				if (!number) {
					console.error(`Invalid sentence: "${invalid}" does not start with a number`);

					return undefined;
				}

				return sentences[parseInt(number) - 1];
			})
	);
}
