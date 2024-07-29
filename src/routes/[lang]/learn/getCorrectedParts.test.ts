import { expect, test } from 'vitest';
import { getCorrectedParts } from './getCorrectedParts';

test('isCorrectedParts', async () => {
	expect(getCorrectedParts('abc hello def', ['hello'])).toEqual([
		{ part: 'abc ', isCorrected: false },
		{ part: 'hello', isCorrected: true },
		{ part: ' def', isCorrected: false }
	]);

	expect(getCorrectedParts('abc hello def', ['hello def'])).toEqual([
		{ part: 'abc ', isCorrected: false },
		{ part: 'hello def', isCorrected: true }
	]);

	expect(getCorrectedParts('abcd abc def', ['abc'])).toEqual([
		{ part: 'abcd ', isCorrected: false },
		{ part: 'abc', isCorrected: true },
		{ part: ' def', isCorrected: false }
	]);
});
