import { addWordToLemma } from '../db/lemmas';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { toWords } from './toWords';

import * as sentences from '../db/sentences';

export async function addSentence(sentenceString: string, english: string, lemmas: string[]) {
	console.log(`Adding sentence "${sentenceString}" (lemmas: ${lemmas.join(' ')})...`);

	const wordStrings = toWords(sentenceString);

	if (wordStrings.length !== lemmas.length) {
		console.error(
			'Number of words does not match number of lemmas:\n',
			sentenceString,
			'\n',
			lemmas
		);

		return;
	}

	const words = await getMultipleWordsByLemmas(lemmas);

	const missingWords = lemmas.filter((lemma) => !words.some((word) => word.word == lemma));

	words.push(...(await Promise.all(missingWords.map(async (lemma) => (await addWord(lemma))!))));

	await Promise.all(
		lemmas
			.map((lemma, i) => [lemma, wordStrings[i]])
			.map(([lemma, wordString]) =>
				addWordToLemma(wordString, words.find((word) => word.word === lemma)!)
			)
	);

	const indexOfWord = (word: string) => {
		const result = lemmas.indexOf(word);

		if (result === -1) {
			throw new Error(`Word ${word} not found in lemmas`);
		}
		return result;
	};

	return sentences.addSentence({
		sentenceString,
		english,
		words: words.sort((a, b) => indexOfWord(a.word!) - indexOfWord(b.word!))
	});
}
