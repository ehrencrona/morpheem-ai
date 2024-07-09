import { expect, test } from 'vitest';
import { Clause } from '../../ai/splitIntoClauses';
import { translationToFragments } from './translationToFragments';

test('translationToFragments Dutch', async () => {
	const sentence = {
		sentence: `Ze zeggen wel eens: 'Zonder plan ben je als een dichte doos zonder sleutel.'`,
		english: `They sometimes say: 'Without a plan you are like a closed box without a key.'`
	};

	const clauses: Clause[] = [
		{ sentence: 'Ze zeggen', english: 'They say' },
		{ sentence: 'wel eens', english: 'sometimes' },
		{ sentence: 'Zonder plan', english: 'Without a plan' },
		{ sentence: 'ben je', english: 'you are' },
		{ sentence: 'als een dichte doos', english: 'like a closed box' },
		{ sentence: 'zonder sleutel', english: 'without a key' }
	];

	const fragments = translationToFragments(sentence.english, clauses);

	expect(fragments).toEqual([
		{
			fragment: 'They',
			clauses: [
				{
					sentence: 'Ze zeggen',
					english: 'They say'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'sometimes',
			clauses: [
				{
					sentence: 'wel eens',
					english: 'sometimes'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'say',
			clauses: [
				{
					sentence: 'Ze zeggen',
					english: 'They say'
				}
			]
		},
		{
			fragment: ": '",
			clauses: []
		},
		{
			fragment: 'Without a plan',
			clauses: [
				{
					sentence: 'Zonder plan',
					english: 'Without a plan'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'you are',
			clauses: [
				{
					sentence: 'ben je',
					english: 'you are'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'like a closed box',
			clauses: [
				{
					sentence: 'als een dichte doos',
					english: 'like a closed box'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'without a key',
			clauses: [
				{
					sentence: 'zonder sleutel',
					english: 'without a key'
				}
			]
		},
		{
			fragment: ".'",
			clauses: []
		}
	]);
});

test('translationToFragments', async () => {
	const sentence = {
		sentence: 'Długo szukałam idealnej sukienki na wesele mojej przyjaciółki.',
		english: "I searched for the perfect dress for my friend's wedding for a long time."
	};

	const clauses: Clause[] = [
		{ sentence: 'długo', english: 'for a long time' },
		{ sentence: 'szukałam', english: 'I searched' },
		{ sentence: 'idealnej sukienki', english: 'for the perfect dress' },
		{ sentence: 'na wesele mojej przyjaciółki', english: "for my friend's wedding" }
	];

	const fragments = translationToFragments(sentence.english, clauses);

	expect(fragments).toEqual([
		{
			fragment: 'I searched',
			clauses: [
				{
					sentence: 'szukałam',
					english: 'I searched'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'for the perfect dress',
			clauses: [
				{
					sentence: 'idealnej sukienki',
					english: 'for the perfect dress'
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: "for my friend's wedding",
			clauses: [
				{
					sentence: 'na wesele mojej przyjaciółki',
					english: "for my friend's wedding"
				}
			]
		},
		{
			fragment: ' ',
			clauses: []
		},
		{
			fragment: 'for a long time',
			clauses: [
				{
					sentence: 'długo',
					english: 'for a long time'
				}
			]
		},
		{
			fragment: '.',
			clauses: []
		}
	]);
});
