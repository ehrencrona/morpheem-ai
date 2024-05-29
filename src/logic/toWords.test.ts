import { describe, expect } from 'vitest';
import { toWords, toWordsWithSeparators } from './toWords';
import { FRENCH, POLISH } from '../constants';

describe('toWords', (it) => {
	it('should split a sentence into words', () => {
		expect(toWords('Hello, world!', POLISH)).toEqual(['hello', 'world']);
	});

	it('should split a sentence into words with separators', () => {
		expect(toWordsWithSeparators('Hello, world!', POLISH)).toEqual(['Hello', ', ', 'world', '!']);
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
});
