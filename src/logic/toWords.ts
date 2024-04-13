
export function toWords(sentence: string) {
	return sentence
		.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ')
		.split(' ')
		.filter((word) => word.length > 0)
		.map((word) => word.toLowerCase());
}
