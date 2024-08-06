import { expect, test } from 'vitest';
import { getClauses, storeClauses } from './sentences';
import { POLISH } from '../constants';

test('setClauses', async ({}) => {
	const sentenceId = 4301;
	const clauses = [
		{
			english: 'They',
			sentence: 'Oni'
		}
	];

	await storeClauses(clauses, sentenceId, POLISH);

	expect(await getClauses(sentenceId, POLISH)).toEqual(clauses);

	await storeClauses(undefined, sentenceId, POLISH);
});
