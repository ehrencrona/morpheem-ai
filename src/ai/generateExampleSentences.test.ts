import { expect, test } from 'vitest';
import { generateExampleSentences } from './generateExampleSentences';

test('generateExampleSentences', async ({}) => {
	expect((await generateExampleSentences('odcinek')).length).toBeGreaterThan(0);
});
