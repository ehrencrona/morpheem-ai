import { Language } from './logic/types';

export const POLISH: Language = {
	code: 'pl',
	name: 'Polish',
	schema: 'pl',
	isLatin: true
};

export const FRENCH: Language = {
	code: 'fr',
	name: 'French',
	schema: 'fr',
	isLatin: true
};

export const SPANISH: Language = {
	code: 'es',
	name: 'Spanish',
	schema: 'es',
	isLatin: true
};

export const KOREAN: Language = {
	code: 'ko',
	name: 'Korean',
	schema: 'ko',
	isLatin: false
};

export const DUTCH: Language = {
	code: 'nl',
	name: 'Dutch',
	schema: 'nl',
	isLatin: true
};

export const RUSSIAN: Language = {
	code: 'ru',
	name: 'Russian',
	schema: 'ru',
	isLatin: false
};

export const SWEDISH: Language = {
	code: 'sv',
	name: 'Swedish',
	schema: 'sv',
	isLatin: true
};

export const languages = [POLISH, FRENCH, SPANISH, KOREAN, DUTCH, RUSSIAN, SWEDISH];
