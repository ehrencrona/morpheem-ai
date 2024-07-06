export function findPhraseIndex(
	phrase: string,
	wordsWithSeparators: string[]
): { from: number; to: number } | undefined {
	const lowerCasePhrase = phrase.toLowerCase();

	function isPhraseAtIndex(index: number) {
		let phraseAtIndex = '';

		for (let i = index; i < wordsWithSeparators.length; i++) {
			phraseAtIndex += wordsWithSeparators[i].toLowerCase();

			if (lowerCasePhrase == phraseAtIndex) {
				return { from: index, to: i };
			}

			if (!lowerCasePhrase.startsWith(phraseAtIndex)) {
				break;
			}
		}

		return undefined;
	}

	for (let i = 0; i < wordsWithSeparators.length; i++) {
		const result = isPhraseAtIndex(i);

		if (result) {
			return result;
		}
	}

	console.error(`Phrase not found: "${phrase}" in "${wordsWithSeparators.join('')}"`);
}
