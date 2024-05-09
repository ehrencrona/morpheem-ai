import { expect, test } from 'vitest';
import { inventExampleSentences } from './inventExampleSentences';

test('inventExampleSentences', async ({}) => {
	expect((await inventExampleSentences('odcinek', 3)).length).toEqual(3);
});
