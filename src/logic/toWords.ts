export function toWords(sentence: string) {
	return sentence
		.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ')
		.split(' ')
		.filter((word) => word.length > 0)
		.map((word) => word.toLowerCase());
}

export function toWordsWithSeparators(sentence: string) {
	return sentence.split(/([^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/).filter((word) => word.length > 0);
}
