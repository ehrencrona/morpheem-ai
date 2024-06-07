import { Language } from './types';

export function toWords(sentence: string, language: Language) {
	if (language.code == 'pl') {
		return sentence
			.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ')
			.split(' ')
			.filter((word) => word.length > 0)
			.map((word) => word.toLowerCase());
	} else if (language.code == 'fr') {
		// Define regex pattern for tokenization including Unicode characters
		const pattern = /[\p{L}]+(?:-[\p{L}]+)?(?:'[\p{L}]+)?/gu;

		// Find all matches in the sentence
		let tokens = sentence.match(pattern) || [];

		// Further split tokens with apostrophes
		let splitTokens: string[] = [];

		tokens.forEach((token) => {
			if (token.includes("'") && token.length > 1) {
				let index = token.indexOf("'");
				splitTokens.push(token.slice(0, index + 1), token.slice(index + 1));
			} else {
				splitTokens.push(token);
			}
		});

		return splitTokens.map((t) => t.toLowerCase());
	} else if (language.code == 'es') {
		return sentence
			.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ-]/g, ' ')
			.split(' ')
			.filter((word) => word.length > 0)
			.filter((word) => word != '-')
			.map((word) => word.toLowerCase()); // Convert to lowercase
	} else {
		throw new Error('Unsupported language');
	}
}

export function toWordsWithSeparators(sentence: string, language: Language) {
	if (language.code == 'pl') {
		return sentence.split(/([^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]+)/).filter((word) => word.length > 0);
	} else if (language.code == 'fr') {
		// Define regex pattern for tokenization including Unicode characters, punctuation, and spaces
		const pattern = /[\p{L}]+(?:-[\p{L}]+)?(?:'[\p{L}]+)?|[\p{L}]+|'|[.,!?;:]+|["“”«»„]| +/gu;

		// Find all matches in the sentence
		let tokens = sentence.match(pattern) || [];

		// Further split tokens with apostrophes
		let splitTokens: string[] = [];

		for (let i = 0; i < tokens.length; i++) {
			let token = tokens[i];
			if (token.includes("'") && token.length > 1 && !token.startsWith("'")) {
				let index = token.indexOf("'");
				splitTokens.push(token.slice(0, index + 1));
				splitTokens.push(token.slice(index + 1));
			} else {
				splitTokens.push(token);
			}
		}

		return splitTokens;
	} else if (language.code == 'es') {
		return sentence.split(/([^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ-]+)/).filter((word) => word.length > 0);
	} else {
		throw new Error('Unsupported language');
	}
}

export function isSeparator(word: string) {
	return (
		word.match(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻàâçéèêëîïôûùüÿÀÂÇÉÈÊËÎÏÔÛÙÜŸáéíóúüñÁÉÍÓÚÜÑ'-]+/) ||
		/* apostrophe is part of words in french */
		word == "'"
	);
}
