import { expect, it } from 'vitest';
import { translateSentences, translateWordInContext, translateWordOutOfContext } from './translate';
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

// starting collection of tests:

// W miejscu pracy stosuj odpowiednie środki ochrony.
// "apply" or "use"

it('handles expressions', async () => {
	const res = await translateWordInContext(
		'wrażenie',
		{
			sentence: 'Mebel z litego drewna sprawia wrażenie solidnego i trwałego.'
		},
		POLISH
	);

	expect(res).toMatchObject({
		english: 'impression',
		expression: {
			english: 'to give the impression',
			expression: 'sprawiać wrażenie'
		}
	});
});

it('handles expressions 2', async () => {
	const res = await translateWordInContext(
		'bułka',
		{
			sentence: 'Dla niego to było bułka z masłem.'
		},
		POLISH
	);

	expect(res).toMatchObject({
		english: 'roll',
		expression: {
			english: 'piece of cake',
			expression: 'bułka z masłem'
		}
	});
});

// not so sure this is relevant. answering with either gender should be fine.
it.skip('adds context when translating words', async () => {
	const res = await translateWordInContext(
		'zaprosiła',
		{
			sentence: 'Zaprosiła go na obiad do swojego ulubionego lokalu'
		},
		POLISH
	);

	expect(res.english).toEqual('she invited');
});

it('handles wynosić', async () => {
	const res = await translateWordInContext(
		'wynosił',
		{
			sentence: 'Wynosił się z domu bez żadnego słowa.'
		},
		POLISH
	);

	expect(res.english).toEqual('he left');
});

it('translates words out of context', async () => {
	const res = await translateWordOutOfContext('zaprosić', POLISH);

	expect(res.english).toEqual('to invite');
});

it('translates words in context 2', async () => {
	const res = await Promise.all([
		translateWordInContext(
			'zamek',
			{
				sentence: 'W Polsce jest wiele pięknych zamków.'
			},
			POLISH
		),
		translateWordInContext(
			'zamek',
			{
				sentence: 'W kurtce zepsuł mi się zamek.'
			},
			POLISH
		)
	]);

	expect(res[0].english).toEqual('castle');
	expect(res[1].english).toContain('zip');
});

it('translates word in context', async () => {
	const [peace, world] = await Promise.all([
		translateWordInContext(
			'miru',
			{
				sentence: 'Pragniemy miru na całym świecie.'
			},
			POLISH
		),
		translateWordInContext(
			'miru',
			{
				sentence: 'Odkrywanie nowych kultur poszerza nasz mir.'
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
				sentence: `Juan está leyendo 'Don Quijote de la Mancha', una obra de Cervantes.`
			},
			SPANISH
		)
	).toMatchObject({ english: 'Quijote', transliteration: undefined });
});

it('translates Korean', async () => {
	const sentence = { sentence: '그는 학교에 다녀요.', english: 'He goes to school.' };

	const school = await translateWordInContext('학교', sentence, KOREAN);

	expect(school).toEqual({ english: 'school', form: 'location', transliteration: 'hak-gyo' });
});
