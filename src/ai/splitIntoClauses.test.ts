import { expect, test } from 'vitest';
import { splitIntoClausesAndTranslate } from './splitIntoClauses';
import { POLISH } from '../constants';

test('splitIntoClauses', async () => {
	const res = await splitIntoClausesAndTranslate(
		{ sentence: 'Wiele osób chce otrzymać nagrodę.' },
		POLISH
	);

	expect(res.translation).toContain('Many people want to receive');
	expect(res.clauses.length).toBeGreaterThan(3);
});
