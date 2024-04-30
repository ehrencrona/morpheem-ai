import { expect, it } from 'vitest';
import { translateSentences, translateWords } from './translate';

it('translates sentences', async () => {
	expect(
		await translateSentences(['Co robiłeś wczoraj wieczorem?', 'Ten film bardzo mi się podoba.'], {
			temperature: 0
		})
	).toEqual(['What were you doing last night?', 'I really like this movie.']);
});

it('translates words', async () => {
	expect(await translateWords(['piękny', 'kot'])).toEqual(['beautiful', 'cat']);
});
