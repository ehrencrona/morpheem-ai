import { ask } from './ask';

async function findInvalidSentences(sentences: string[]) {
	const res = await ask({
		messages: [
			{
				role: 'user',
				content:
					`Go through these Polish sentences, one per line, and evaluate if it is grammatically correct and makes logical sense (in the sense of: could you actually use this sentence in real life).\n` +
					`Repeat the sentence back to me, and then add " -- correct" on the same line if it is correct, or " -- incorrect" if it is incorrect. Do not write anything else\n\n` +
					`Sentences:\n` +
					`${sentences.map((s) => ` - ${s}`).join('\n')}`
			}
		],
		model: 'gpt-4o',
		temperature: 0.3
	});

	return res
		.split('\n')
		.filter((m) => m.match(/ -- incorrect$/))
		.map((m) => m.replace(/^ +- /, ''))
		.map((m) => m.split(' -- incorrect')[0])
		.map((invalid) => {
			if (!sentences.includes(invalid)) {
				console.error(`Invalid sentence "${invalid}" not in original sentences`);
			}

			return invalid;
		});
}
