import { describe, expect } from 'vitest';
import { toWordStrings, toWordsWithSeparators } from './toWordStrings';
import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN, SPANISH } from '../constants';

describe('toWordStrings', (it) => {
	it('should split a sentence into words', () => {
		expect(toWordStrings('Hello, world!', POLISH)).toEqual(['hello', 'world']);
	});

	it('handles tweets', () => {
		expect(toWordStrings(`Jestem #developerem!`, POLISH)).toEqual(['jestem', 'developerem']);
	});

	it('should split a sentence into words with separators', () => {
		expect(toWordsWithSeparators('Hello, world!', POLISH)).toEqual(['Hello', ', ', 'world', '!']);
	});

	it('handles dashed compound words', () => {
		expect(toWordStrings(`On eks-prezydentem`, POLISH)).toEqual(['on', 'eks-prezydentem']);
	});

	it(`handles Dutch`, () => {
		expect(toWordStrings(`Zo'n gekke vent!`, DUTCH)).toEqual([`zo'n`, 'gekke', 'vent']);

		expect(toWordStrings(`Men zegt: 'Zomaar?'`, DUTCH)).toEqual(['men', 'zegt', `zomaar`]);

		expect(toWordStrings(`How gaat 't?`, DUTCH)).toEqual(['how', 'gaat', `'t`]);

		expect(toWordStrings(`Zo'n gekke vent!`, DUTCH)).toEqual([`zo'n`, 'gekke', 'vent']);

		expect(toWordStrings(`Dit is Anna's huis.`, DUTCH)).toEqual(['dit', 'is', `anna's`, 'huis']);
	});

	it(`handles Dutch apostrophes`, () => {
		{
			const sentence = `Ik zei: 'hoe is 't?'`;
			expect(toWordStrings(sentence, DUTCH)).toEqual(['ik', 'zei', `hoe`, 'is', `'t`]);
			expect(toWordsWithSeparators(sentence, DUTCH).join('')).toEqual(sentence);
			expect(toWordStrings(sentence, DUTCH)).toContain(`'t`);
		}

		{
			const sentence = `'s-Hertogenbosch is m'n stad. Ze wordt genoemd de 'moerasdraak'.`;

			expect(toWordStrings(sentence, DUTCH)).toContain(`'s-hertogenbosch`);
			expect(toWordStrings(sentence, DUTCH)).toContain(`m'n`);
			expect(toWordStrings(sentence, DUTCH)).toContain(`de`);
			expect(toWordStrings(sentence, DUTCH)).toContain(`moerasdraak`);

			expect(toWordsWithSeparators(sentence, DUTCH).join('')).toEqual(sentence);
		}
	});

	it(`handles Russian`, () => {
		expect(toWordStrings('вперёд!', RUSSIAN)).toEqual(['вперёд']);
		expect(toWordsWithSeparators('вперёд!', RUSSIAN)).toEqual(['вперёд', '!']);

		expect(toWordStrings(`убийстве 18-летней девушки`, RUSSIAN)).toEqual([
			'убийстве',
			'летней',
			'девушки'
		]);

		expect(toWordStrings(`Об этом сообщает «Татар-информ» и «Коммерсант».`, RUSSIAN)).toEqual([
			'об',
			'этом',
			'сообщает',
			'татар-информ',
			'и',
			'коммерсант'
		]);
	});

	it('should split a Spanish sentence into words', () => {
		// expect(toWordStrings(`El límite de velocidad es de 80 km/h.`, SPANISH)).toEqual([
		// 	`el`,
		// 	`límite`,
		// 	`de`,
		// 	`velocidad`,
		// 	`es`,
		// 	`de`,
		// 	`80`,
		// 	`km/h`
		// ]);

		expect(toWordStrings(`Pedro y Ana celebrarán su 10º aniversario.`, SPANISH)).toEqual([
			`pedro`,
			`y`,
			`ana`,
			`celebrarán`,
			`su`,
			`º`,
			`aniversario`
		]);
	});

	it('should split a French sentence into words', () => {
		expect(toWordStrings(`Que-ce que c'est que ça?`, FRENCH)).toEqual([
			`que-ce`,
			`que`,
			`c'`,
			`est`,
			`que`,
			`ça`
		]);

		expect(toWordStrings(`Cette fois-là, c'est la bonne.`, FRENCH)).toEqual([
			`cette`,
			`fois`,
			`là`,
			`c'`,
			`est`,
			`la`,
			`bonne`
		]);

		expect(toWordStrings(`C'est un beau jour lorsqu'il y a du soleil.`, FRENCH)).toEqual([
			`c'`,
			`est`,
			`un`,
			`beau`,
			`jour`,
			`lorsqu'`,
			`il`,
			`y`,
			`a`,
			`du`,
			`soleil`
		]);

		expect(toWordStrings(`Quelqu'un m'a dit`, FRENCH)).toEqual([`quelqu'un`, `m'`, `a`, `dit`]);

		expect(toWordStrings(`J'ai dit: "Tais-toi!" Et il m'a répondu: 'Saloppe!'`, FRENCH)).toEqual([
			`j'`,
			`ai`,
			`dit`,
			`tais-toi`,
			`et`,
			`il`,
			`m'`,
			`a`,
			`répondu`,
			`saloppe`
		]);

		expect(toWordStrings(`Le «Minitel» est une invention française.`, FRENCH)).toEqual([
			'le',
			'minitel',
			'est',
			'une',
			'invention',
			'française'
		]);
	});

	it('should split a French sentence into words with separators', () => {
		expect(toWordsWithSeparators(`Que-ce que c'est que ça?`, FRENCH)).toEqual([
			`Que-ce`,
			' ',
			`que`,
			' ',
			`c'`,
			`est`,
			' ',
			`que`,
			' ',
			`ça`,
			'?'
		]);

		expect(
			toWordsWithSeparators(`J'ai dit: "Tais-toi!" Et il m'a répondu: 'Saloppe!'`, FRENCH)
		).toEqual([
			`J'`,
			`ai`,
			' ',
			`dit`,
			':',
			' ',
			'"',
			`Tais-toi`,
			'!',
			'"',
			' ',
			`Et`,
			' ',
			`il`,
			' ',
			`m'`,
			`a`,
			' ',
			`répondu`,
			':',
			' ',
			"'",
			`Saloppe`,
			'!',
			"'"
		]);

		expect(toWordsWithSeparators(`Le «Minitel» est une invention française.`, FRENCH)).toEqual([
			'Le',
			' ',
			'«',
			'Minitel',
			'»',
			' ',
			'est',
			' ',
			'une',
			' ',
			'invention',
			' ',
			'française',
			'.'
		]);
	});

	it('should split a Korean sentence into words', () => {
		expect(toWordStrings(`내일 중요한 결정을 내려야 합니다`, KOREAN)).toEqual([
			'내일',
			'중요한',
			'결정을',
			'내려야',
			'합니다'
		]);
	});
});
