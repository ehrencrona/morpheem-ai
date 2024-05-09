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
		translateWordInContext('miru', {
			sentence: 'Pragniemy miru na całym świecie.',
			english: 'We want peace all over the world.'
		}),
		translateWordInContext('miru', {
			sentence: 'Odkrywanie nowych kultur poszerza nasz mir.',
			english: 'Discovering new cultures broadens our worldview.'
		})
	]);

	expect(peace.english).toMatch(/peace/i);
	expect(world.english).toMatch(/world/i);
});
