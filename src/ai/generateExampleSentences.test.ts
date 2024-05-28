import { expect, test } from 'vitest';
import { generateExampleSentences } from './generateExampleSentences';
import { POLISH } from '../constants';

test('generateExampleSentences', async ({}) => {
	expect(
		(await generateExampleSentences('odcinek', undefined, undefined, POLISH)).length
	).toBeGreaterThan(0);
});
