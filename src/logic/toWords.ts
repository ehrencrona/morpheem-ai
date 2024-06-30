import { Language } from './types';

export function toWords(
	sentence: string,
	language: Language,
	{ doLowerCase = true }: { doLowerCase?: boolean } = {}
) {
	function toLowerCase(word: string) {
		return doLowerCase ? word.toLowerCase() : word;
	}

	if (language.code == 'fr') {
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

		return splitTokens.map(toLowerCase);
	} else if (language.code == 'nl') {
		return (
			sentence
				.replace(/[^\p{L}'-]/gu, ' ')
				.split(' ')
				// deals with e.g. 18-year-old
				.map((word) => word.replace(/^-/, ''))
				// "covid-19"
				.map((word) => word.replace(/-$/, ''))
				.map((word) => /* removing trailing apostrophe */ word.replace(/'$/, ''))
				.map(
					(
						word /* remove leading apostrophe if the word (or just first part of word with dash, see 's-hertogenbosch) is longer than three letters 
						 or starts with a capital letter, keep for e.g. 't, 'ie */
					) =>
						word.split('-')[0].length > 3 || word.match(/^'[A-Z]/) ? word.replace(/^'/, '') : word
				)
				.filter((word) => word != `'`)
				.filter((word) => word.length > 0)
				.map(toLowerCase)
		);
	} else {
		return (
			sentence
				.replace(/[^\p{L}-]/gu, ' ')
				.split(' ')
				// deals with e.g. 18-year-old
				.map((word) => word.replace(/^-/, ''))
				// "covid-19"
				.map((word) => word.replace(/-$/, ''))
				.filter((word) => word.length > 0)
				.map(toLowerCase)
		);
	}
}

export function toWordsWithSeparators(sentence: string, language: Language) {
	if (language.code == 'fr') {
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
	} else if (language.code == 'nl') {
		return sentence
			.split(/([^a-zA-Z'-]+)/)
			.map((word) =>
				/* split words with trailing apostrophe into word plus apostrophe array */
				word[word.length - 1] == `'` ? [word.slice(0, -1), word.slice(-1)] : [word]
			)
			.flat()
			.map((word) =>
				/* for words with leading apostrophe if the word (or just first part of word with dash, see 's-hertogenbosch) is longer than three letters
					 or starts with a capital letter, split into apostrophe plus word array, e.g. 't, 'ie */
				word[0] == `'` && (word.length > 3 || word.match(/^'[A-Z]/))
					? [word[0], word.slice(1)]
					: [word]
			)
			.flat()
			.filter((word) => word.length > 0);
	} else {
		return sentence.split(/([^\p{L}-]+)/u).filter((word) => word.length > 0);
	}
}

export function isSeparator(word: string) {
	return (
		word.match(/[^\p{L}'-]+/u) ||
		/* apostrophe is part of words in french */
		word == "'"
	);
}
