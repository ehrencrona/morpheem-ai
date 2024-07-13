import { expect, test } from 'vitest';
import { POLISH } from '../constants';
import { simplifyText } from './simplifyText';

test('simplify text', async ({}) => {
	const res = await simplifyText(
		'A przepaść między nimi a największymi miastami zaczyna przybierać niebezpieczne rozmiary.',
		{ language: POLISH }
	);

	expect(res).not.toContain(`Here's`);
});
