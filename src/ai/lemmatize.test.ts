import { expect, it } from 'vitest';
import { lemmatizeSentences } from './lemmatize';
import { POLISH } from '../constants';

it('should return lemmas for sentences', async () => {
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

it('lemmatizes single words', async () => {
	expect(await lemmatizeSentences(['fletnię'], { language: POLISH })).toEqual([['fletnia']]);
});
