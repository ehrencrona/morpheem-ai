import { expect, test } from 'vitest';
import { splitIntoDiff } from './splitIntoDiff';

test('splitIntoDiff', (t) => {
	expect(splitIntoDiff('abc', 'aec')).toEqual(['a', 'b', 'c']);

	expect(splitIntoDiff('abc', 'abc')).toEqual(['abc', '', '']);

	expect(splitIntoDiff('abc', 'abcd')).toEqual(['abc', '', '']);

	expect(splitIntoDiff('abcd', 'abc')).toEqual(['abc', 'd', '']);

	expect(splitIntoDiff('abc', 'def')).toEqual(['', 'abc', '']);

	expect(splitIntoDiff('', 'def')).toEqual(['', '', '']);

	expect(splitIntoDiff('abc', '')).toEqual(['', 'abc', '']);
});
