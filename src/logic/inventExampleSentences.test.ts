import { expect, test } from 'vitest';
import { inventExampleSentences } from './inventExampleSentences';

test('inventExampleSentences', async ({}) => {
	const word = 'odcinek';

	const sentences = await inventExampleSentences(word, undefined, 3);

	expect(sentences.length).toBeGreaterThan(2);

	console.log(sentences.map((sentence) => sentence.sentence));

	for (const sentence of sentences) {
		expect(sentence.lemmatized).toContain(word);
	}
});
