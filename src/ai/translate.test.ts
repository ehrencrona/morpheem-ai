import { expect, it } from 'vitest';
import { translateSentences, translateWordInContext, translateWords } from './translate';

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

it('translates word in context', async () => {
	const [peace, world] = await Promise.all([
		translateWordInContext('miru', 'Pragniemy miru na całym świecie.'),
		translateWordInContext('miru', 'Odkrywanie nowych kultur poszerza nasz mir.')
	]);

	expect(peace.lemma).toEqual('mir');

	expect(peace.english).toContain('peace');
	expect(world.english).toContain('world');
});
