import { expect, it } from 'vitest';
import { translate } from './translate';

it('translates sentences', async () => {
	expect(
		await translate(['Co robiłeś wczoraj wieczorem?', 'Ten film bardzo mi się podoba.'], {
			temperature: 0
		})
	).toEqual(['What were you doing last night?', 'I really like this movie.']);
});

it('translates words', async () => {
	expect(await translate(['piękny', 'kot'], { temperature: 0 })).toEqual(['beautiful', 'cat']);
});
