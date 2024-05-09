import { expect, test } from 'vitest';
import { findCognates } from './cognates';

test('cognates', async ({}) => {
	const cognates = await findCognates([
		'finanse',
		'na',
		'w',
		'z',
		'ten',
		'mój',
		'i',
		'nie',
		'nowy',
		'atak',
		'to',
		'swój',
		'lubić',
		'bardzo',
		'po',
		'ja',
		'czy',
		'kupić',
		'park',
		'amortyzacja',
		'zawsze',
		'jest',
		'wiele',
		'prezent',
		'który',
		'on',
		'anegdota',
		'zablokować',
		'robić',
		'bohatera',
		'książka',
		'ambasada',
		'paczka',
		'pamięć',
		'mebel',
		'ananas',
		'pogoda',
		'od',
		'dobry',
		'dostępny',
		'samochód',
		'nowoczesny',
		'żeby',
		'mi',
		'spotkanie',
		'podobać',
		'antylopa',
		'kobieta',
		'film',
		'oglądać'
	]);

	const definiteCognates = [
		'finanse',
		'park',
		'anegdota',
		'prezent',
		'film',
		'amortyzacja',
		'antylopa',
		'ambasada',
		'atak'
	];
	const possibleCognates = ['ten', 'mój', 'nie', 'nowy', 'to', 'paczka', 'ja', 'zablokować'];

	for (const expectedCognate of definiteCognates) {
		expect(cognates).toContain(expectedCognate);
	}

	console.log(cognates);

	for (const cognate of cognates) {
		if (!possibleCognates.includes(cognate) && !definiteCognates.includes(cognate)) {
			throw new Error(`Unexpected cognate: ${cognate}`);
		}
	}
});
