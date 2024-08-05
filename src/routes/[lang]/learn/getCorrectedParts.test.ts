import { expect, test } from 'vitest';
import { getCorrectedParts } from './getCorrectedParts';

test('isCorrectedParts', async () => {
	expect(getCorrectedParts('abc hëllo def', ['hëllo'])).toEqual([
		{ part: 'abc ', isCorrected: false },
		{ part: 'hëllo', isCorrected: true },
		{ part: ' def', isCorrected: false }
	]);

	expect(getCorrectedParts("abc a-b' def", ["a-b'"])).toEqual([
		{ part: 'abc ', isCorrected: false },
		{ part: "a-b'", isCorrected: true },
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

	expect(
		getCorrectedParts('Należy nawilżyć skórę aby zachowaċ elastycznośċ y zdrowy.', ['y'])
	).toEqual([
		{ part: 'Należy nawilżyć skórę aby zachowaċ elastycznośċ ', isCorrected: false },
		{ part: 'y', isCorrected: true },
		{ part: ' zdrowy.', isCorrected: false }
	]);
});
