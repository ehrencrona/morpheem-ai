import { shuffle } from 'simple-statistics';
import { expect, test } from 'vitest';
import { KOREAN, POLISH } from '../constants';
import { classifyLemmas } from './classifyLemmas';

test('classify single word', async () => {
	const res = await classifyLemmas(['finanse'], { language: POLISH, throwOnInvalid: false });

	expect(res[0].type).toBe('cognate');
});

test('cognates', async ({}) => {
	const cognates = (
		await classifyLemmas(
			[
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
			],
			{ language: POLISH, throwOnInvalid: false }
		)
	)
		.filter(({ type }) => type === 'cognate')
		.map(({ lemma }) => lemma);

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

test('Korean cognates', async ({}) => {
	const knownCognates = [
		'컴퓨터',
		'인터넷',
		'카메라',
		'티비',
		'커피',
		'치즈',
		'초콜릿',
		'버스',
		'택시',
		'아파트',
		'사이다',
		'샴푸',
		'브랜드',
		'인터뷰',
		'미팅'
	];

	const knownNonCognates = [
		'사랑',
		'친구',
		'음식',
		'학교',
		'책',
		'바다',
		'하늘',
		'노래',
		'집',
		'사람'
	];

	const cognates = (
		await classifyLemmas(shuffle(knownCognates.concat(knownNonCognates)), {
			language: KOREAN,
			throwOnInvalid: false
		})
	)
		.filter(({ type }) => type === 'cognate')
		.map(({ lemma }) => lemma);

	for (const expectedCognate of knownCognates) {
		expect(cognates).toContain(expectedCognate);
	}

	for (const nonCognate of knownNonCognates) {
		expect(cognates).not.toContain(nonCognate);
	}
});

test('classifies Polish lemmas', async ({}) => {
	expect(
		await classifyLemmas(
			'walentynki,powinien,folia,kręcić,wstawać,obiecać,modowego,kolor,plażować'.split(','),
			{ language: POLISH, throwOnInvalid: false }
		)
	).toEqual([
		{ lemma: 'walentynki', type: 'cognate' },
		{ lemma: 'powinien', type: undefined },
		{ lemma: 'folia', type: 'cognate' },
		{ lemma: 'kręcić', type: undefined },
		{ lemma: 'wstawać', type: undefined },
		{ lemma: 'obiecać', type: undefined },
		{ lemma: 'modowego', type: 'inflection' },
		{ lemma: 'kolor', type: 'cognate' },
		{ lemma: 'plażować', type: undefined }
	]);
});
