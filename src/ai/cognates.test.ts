import { expect, test } from 'vitest';
import { findCognates, findKoreanCognates } from './cognates';
import { KOREAN, POLISH } from '../constants';
import { shuffle } from 'simple-statistics';

test('cognates', async ({}) => {
	const cognates = await findCognates(
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
		POLISH
	);

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

test.only('Korean cognates', async ({}) => {
	const knownCognates = [
		'컴퓨터',
		'인터넷',
		'카메라',
		'티비',
		'커피',
		'핸드폰',
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

	const cognates = await findCognates(shuffle(knownCognates.concat(knownNonCognates)), KOREAN);

	console.log(cognates);

	for (const expectedCognate of knownCognates) {
		expect(cognates).toContain(expectedCognate);
	}

	for (const nonCognate of knownNonCognates) {
		expect(cognates).not.toContain(nonCognate);
	}
});
