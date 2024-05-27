import { expect, test } from 'vitest';
import { generateExampleSentences } from './generateExampleSentences';

test('generateExampleSentences', async ({}) => {
	const word = 'odcinek';

	const sentences = await generateExampleSentences(word, {
		userId: 4711
	});

	expect(sentences.length).toBeGreaterThan(2);

	console.log(sentences.map((sentence) => sentence.sentence));

	for (const sentence of sentences) {
		expect(sentence.lemmas).toContain(word);
	}
});
