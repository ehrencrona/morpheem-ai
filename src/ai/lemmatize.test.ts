import { expect, it } from 'vitest';
import { FRENCH, POLISH } from '../constants';
import { lemmatizeSentences } from './lemmatize';

it('should return lemmas for Polish sentences', async () => {
	expect(
		await lemmatizeSentences(
			[
				'Kąpiele w bałtyckiej wodzie są odświeżające i zdrowe dla skóry.',
				'Nie mogę znaleźć kluczy z samochodu.',
				'Zrobiłem zakupy w sklepie spożywczym.',
				'Zadzwoniłem do szefa z ważną informacją.'
			],
			{ language: POLISH }
		)
	).toEqual([
		['kąpiel', 'w', 'bałtycki', 'woda', 'być', 'odświeżający', 'i', 'zdrowy', 'dla', 'skóra'],
		['nie', 'móc', 'znaleźć', 'klucz', 'z', 'samochód'],
		['zrobić', 'zakup', 'w', 'sklep', 'spożywczy'],
		['zadzwonić', 'do', 'szef', 'z', 'ważny', 'informacja']
	]);
});

it('should return lemmas for French sentences', async () => {
	expect(await lemmatizeSentences(['Elle est fière de sa maison'], { language: FRENCH })).toEqual([
		['elle', 'être', 'fier', 'de', 'son', 'maison']
	]);

	expect(
		await lemmatizeSentences(['Elle veut célébrer la réussite avec ses amis.'], {
			language: FRENCH
		})
	).toEqual([['elle', 'vouloir', 'célébrer', 'le', 'réussite', 'avec', 'son', 'ami']]);
});

it('lemmatizes French', async () => {
	const lemmas = await lemmatizeSentences(
		[
			'nous allons célébrer son anniversaire demain ils aiment célébrer noël ensemble',
			'elle veut célébrer sa réussite avec ses amis',
			'peux-tu célébrer avec nous ce soir nous célébrons toujours la nouvelle année en famille'
		],
		{ language: FRENCH }
	);

	console.log(lemmas);

	expect(lemmas).toEqual([
		[
			'nous',
			'aller',
			'célébrer',
			'son',
			'anniversaire',
			'demain',
			'ils',
			'aimer',
			'célébrer',
			'noël',
			'ensemble'
		],
		['elle', 'vouloir', 'célébrer', 'son', 'réussite', 'avec', 'son', 'ami'],
		[
			'pouvoir',
			'célébrer',
			'avec',
			'nous',
			'ce',
			'soir',
			'nous',
			'célébrer',
			'toujours',
			'le',
			'nouveau',
			'année',
			'en',
			'famille'
		]
	]);
});

it('lemmatizes single words', async () => {
	expect(await lemmatizeSentences(['fletnię'], { language: POLISH })).toEqual([['fletnia']]);
});
