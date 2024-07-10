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

	expect(res.clauses.map(({ sentence }) => sentence)).toContain('Wiele osób');
	expect(res.clauses.map(({ sentence }) => sentence)).toContain('nagrodę');
});

test('splitIntoClauses with longer clauses', async () => {
	const res = await splitIntoClausesAndTranslate(
		{ sentence: 'Książka do nauki języka angielskiego jest niezbędna uczniom szkoły podstawowej.' },
		POLISH
	);

	expect(res.clauses.map(({ sentence }) => sentence)).toContain('szkoły podstawowej');
});
