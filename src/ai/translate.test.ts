import { expect, it } from 'vitest';
import { translateSentences, translateWordInContext } from './translate';
import { POLISH } from '../constants';

it('translates sentences', async () => {
	expect(
		(
			await translateSentences(
				['Co robiłeś wczoraj wieczorem?', 'Ten film bardzo mi się podoba.'],
				{
					temperature: 0,
					language: POLISH
				}
			)
		).translations
	).toEqual(['What were you doing last night?', 'I really like this movie.']);
});

it('translates word in context', async () => {
	const [peace, world] = await Promise.all([
		translateWordInContext(
			'miru',
			{
				sentence: 'Pragniemy miru na całym świecie.',
				english: 'We want peace all over the world.'
			},
			POLISH
		),
		translateWordInContext(
			'miru',
			{
				sentence: 'Odkrywanie nowych kultur poszerza nasz mir.',
				english: 'Discovering new cultures broadens our worldview.'
			},
			POLISH
		)
	]);

	expect(peace.english).toMatch(/peace/i);
	expect(world.english).toMatch(/world/i);
});
