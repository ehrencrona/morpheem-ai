import { expect, it } from 'vitest';
import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH } from '../constants';
import { lemmatizeSentences } from './lemmatize';

it('handles ambiguous words in Spanish', async () => {
	const lemmas = await lemmatizeSentences(
		[`Juan tiene mucho trabajo esta semana.`, `Miguel tiene un vuelo a las 8 de la mañana.`],
		{
			language: SPANISH
		}
	);

	expect(lemmas[1][3]).toEqual('vuelo');
	expect(lemmas[0][3]).toEqual('trabajo');
});

it('handles ambiguous words', async () => {
	const lemmas = await lemmatizeSentences([`J'aime le soleil d'été.`, `Je l'ai toujours été.`], {
		language: FRENCH
	});

	expect(lemmas[0][5]).toEqual('été');
	expect(lemmas[1][4]).toEqual('être');
});

it('handles Russian', async () => {
	const lemmas = await lemmatizeSentences(
		[
			`Мы собираемся пойти в кино.`,
			`Он любит читать книги.`,
			`Она хочет пойти в магазин.`,
			`Они приехали на поезде.`,
			`За медицинской помощью обратились 46 пострадавших в результате аварии поезда в Коми`
		],
		{
			language: RUSSIAN
		}
	);

	expect(lemmas).toEqual([
		['мы', 'собираться', 'пойти', 'в', 'кино'],
		['он', 'любить', 'читать', 'книга'],
		['она', 'хотеть', 'пойти', 'в', 'магазин'],
		['они', 'приехать', 'на', 'поезд'],
		[
			'за',
			'медицинский',
			'помощь',
			'обратиться',
			'пострадавший',
			'в',
			'результат',
			'авария',
			'поезд',
			'в',
			'коми'
		]
	]);
});

it('handles Dutch', async () => {
	const lemmas = await lemmatizeSentences(
		[
			`Hoe gaat 't met je?`,
			`Dit is Anna's huis.`,
			`Ik ben een student aan de universiteit.`,
			`Hij heeft een mooie auto.`,
			`Zij heeft een hond en een kat.`,
			`Deze donderdag komen Europese regeringsleiders naar Brussel om de belangrijkste posities te verdelen.`,
			`Het lijstje namen voor topfuncties dat gepresenteerd wordt, is precies zoals eerder voorspeld.`
		],
		{
			language: DUTCH
		}
	);

	expect(lemmas).toEqual([
		['hoe', 'gaan', 'het', 'met', 'jij'],
		['dit', 'zijn', 'anna', 'huis'],
		['ik', 'zijn', 'een', 'student', 'aan', 'de', 'universiteit'],
		['hij', 'hebben', 'een', 'mooi', 'auto'],
		['zij', 'hebben', 'een', 'hond', 'en', 'een', 'kat'],
		[
			'deze',
			'donderdag',
			'komen',
			'europees',
			'regeringsleider',
			'naar',
			'brussel',
			'om',
			'de',
			'belangrijk',
			'positie',
			'te',
			'verdelen'
		],
		[
			'het',
			'lijstje',
			'naam',
			'voor',
			'topfunctie',
			'dat',
			'presenteren',
			'worden',
			'zijn',
			'precies',
			'zoals',
			'vroeg',
			'voorspellen'
		]
	]);
});

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

it('handles broken sentences', async () => {
	const lemmas = await lemmatizeSentences(['mi planirujem excursija na jezero'], {
		language: POLISH
	});

	expect(lemmas).toEqual([['mi', 'planirujem', 'excursija', 'na', 'jezero']]);
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

it('lemmatizes Korean', async () => {
	expect(
		await lemmatizeSentences(['집 앞에 있는 정원이 정말 아름다워요.'], { language: KOREAN })
	).toEqual([['집', '앞', '있다', '정원', '정말', '아름답다']]);

	expect(
		await lemmatizeSentences(['특별 할인 이벤트를 놓치지 마세요!'], { language: KOREAN })
	).toEqual([['특별하다', '할인', '이벤트', '놓치다', '마세요']]);
});
