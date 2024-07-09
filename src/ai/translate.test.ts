import { expect, it } from 'vitest';
import { translateSentences, translateWordInContext } from './translate';
import { KOREAN, POLISH, SPANISH } from '../constants';

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

it('adds context when translating words', async () => {
	const res = await translateWordInContext(
		'zaprosiła',
		{
			sentence: 'Zaprosiła go na odiad do swojego ulubionego lokalu',
			english: 'She invited him to a party at her favorite place.'
		},
		POLISH
	);

	expect(res.english).toEqual('she invited');
});

it.only('works', async () => {
	const res = await translateWordInContext(
		'wynosił',
		{
			sentence: 'Wynosił się z domu bez żadnego słowa.',
			english: 'He left the house without a word.'
		},
		POLISH
	);

	expect(res.english).toEqual('he left');
});

it('translates words out of context', async () => {
	const res = await translateWordInContext('zaprosić', undefined, POLISH);

	expect(res.english).toEqual('to invite');
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

it('translates Spanish', async () => {
	expect(
		await translateWordInContext(
			'Quijote',
			{
				sentence: `Juan está leyendo 'Don Quijote de la Mancha', una obra de Cervantes.`,
				english: `Juan is reading 'Don Quijote de la Mancha', a work by Cervantes.`
			},
			SPANISH
		)
	).toEqual({ english: 'Quixote', form: 'proper noun', transliteration: undefined });
});

it('translates Korean', async () => {
	const sentence = { sentence: '그는 학교에 다녀요.', english: 'He goes to school.' };

	const school = await translateWordInContext('학교', sentence, KOREAN);

	expect(school).toEqual({ english: 'school', form: 'location', transliteration: 'hak-gyo' });
});
