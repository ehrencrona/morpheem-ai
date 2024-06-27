import { describe, expect } from 'vitest';
import { toWords, toWordsWithSeparators } from './toWords';
import { DUTCH, FRENCH, KOREAN, POLISH, RUSSIAN } from '../constants';

describe('toWords', (it) => {
	it('should split a sentence into words', () => {
		expect(toWords('Hello, world!', POLISH)).toEqual(['hello', 'world']);
	});

	it('should split a sentence into words with separators', () => {
		expect(toWordsWithSeparators('Hello, world!', POLISH)).toEqual(['Hello', ', ', 'world', '!']);
	});

	it('handles dashed compound words', () => {
		expect(toWords(`On eks-prezydentem`, POLISH)).toEqual(['on', 'eks-prezydentem']);
	});

	it(`handles Dutch`, () => {
		expect(toWords(`Zo'n gekke vent!`, DUTCH)).toEqual([`zo'n`, 'gekke', 'vent']);

		expect(toWords(`Men zegt: 'Zomaar?'`, DUTCH)).toEqual(['men', 'zegt', `zomaar`]);

		expect(toWords(`How gaat 't?`, DUTCH)).toEqual(['how', 'gaat', `'t`]);

		expect(toWords(`Zo'n gekke vent!`, DUTCH)).toEqual([`zo'n`, 'gekke', 'vent']);

		expect(toWords(`Dit is Anna's huis.`, DUTCH)).toEqual(['dit', 'is', `anna's`, 'huis']);
	});

	it(`handles Dutch apostrophes`, () => {
		{
			const sentence = `Ik zei: 'hoe is 't?'`;
			expect(toWords(sentence, DUTCH)).toEqual(['ik', 'zei', `hoe`, 'is', `'t`]);
			expect(toWordsWithSeparators(sentence, DUTCH).join('')).toEqual(sentence);
			expect(toWords(sentence, DUTCH)).toContain(`'t`);
		}

		{
			const sentence = `'s-Hertogenbosch is m'n stad. Ze wordt genoemd de 'moerasdraak'.`;

			expect(toWords(sentence, DUTCH)).toContain(`'s-hertogenbosch`);
			expect(toWords(sentence, DUTCH)).toContain(`m'n`);
			expect(toWords(sentence, DUTCH)).toContain(`de`);
			expect(toWords(sentence, DUTCH)).toContain(`moerasdraak`);

			expect(toWordsWithSeparators(sentence, DUTCH).join('')).toEqual(sentence);
		}
	});

	it(`handles Russian`, () => {
		expect(toWords('вперёд!', RUSSIAN)).toEqual(['вперёд']);
		expect(toWordsWithSeparators('вперёд!', RUSSIAN)).toEqual(['вперёд', '!']);

		expect(toWords(`убийстве 18-летней девушки`, RUSSIAN)).toEqual([
			'убийстве',
			'летней',
			'девушки'
		]);

		expect(toWords(`Об этом сообщает «Татар-информ» и «Коммерсант».`, RUSSIAN)).toEqual([
			'об',
			'этом',
			'сообщает',
			'татар-информ',
			'и',
			'коммерсант'
		]);
	});

	it('should split a French sentence into words', () => {
		expect(toWords(`Que-ce que c'est que ça?`, FRENCH)).toEqual([
			`que-ce`,
			`que`,
			`c'`,
			`est`,
			`que`,
			`ça`
		]);

		expect(toWords(`J'ai dit: "Tais-toi!" Et il m'a répondu: 'Saloppe!'`, FRENCH)).toEqual([
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

		expect(toWords(`Le «Minitel» est une invention française.`, FRENCH)).toEqual([
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
		expect(toWords(`내일 중요한 결정을 내려야 합니다`, KOREAN)).toEqual([
			'내일',
			'중요한',
			'결정을',
			'내려야',
			'합니다'
		]);
	});
});
