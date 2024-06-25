/** Quick and dirty */
export function toSentences(text: string) {
	/* split on period, question mark, exclamation mark, followed by space or newline */
	let sentences = text.split(/(?<=[.!?])\s/g).filter(Boolean);

	let mergedSentences = [];

	for (let sentence of sentences) {
		if (sentence.match(/^[a-z]/)) {
			mergedSentences[mergedSentences.length - 1] += ' ' + sentence;
		} else {
			mergedSentences.push(sentence);
		}
	}

	return mergedSentences.map((s) => s.trim()).filter(Boolean);
}
