import { toBatches } from '$lib/batch';
import { readFileSync, writeFileSync } from 'fs';
import { ask } from '../../ai/ask';
import { units } from './syllabus';

async function getInvalid(sentences: string[]) {
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
		model: 'claude-3-5-sonnet-20240620',
		temperature: 0.3
	});

	return res
		.split('\n')
		.filter((m) => m.match(/ -- incorrect$/))
		.map((m) => m.split(' -- incorrect')[0]);
}

for (let i = 1; i < units.length + 1; i++) {
	const file = `./unit${i}.txt`;

	let sentences = readFileSync(file, 'utf-8').split('\n');

	for (const batch of toBatches(sentences, 30)) {
		const invalid = await getInvalid(batch);

		console.log(invalid.join('\n'));

		sentences = sentences.filter((s) => !invalid.includes(s));

		writeFileSync(file, sentences.join('\n'));
	}
}
