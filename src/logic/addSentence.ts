import { addWordToLemma } from '../db/lemmas';
import { addWord, getMultipleWords } from '../db/words';
import { toWords } from './toWords';

import * as sentences from '../db/sentences';

export async function addSentence(sentenceString: string, english: string, lemmas: string[]) {
	console.log(`Adding sentence "${sentenceString}"...`);

	const sentenceWords = toWords(sentenceString);

	if (sentenceWords.length !== lemmas.length) {
		console.warn(
			'Number of words does not match number of lemmas:\n',
			sentenceString,
			'\n',
			lemmas
		);

		return;
	}

	const words = await getMultipleWords(lemmas);

	const missingWords = lemmas
		.map((lemma, i) => [lemma, sentenceWords[i]])
		.filter(([lemma]) => !words.some((word) => word.word === lemma));

	const addedWords = await Promise.all(
		missingWords.map(async ([lemma, encounteredForm], index) => (await addWord(lemma))!)
	);

	await Promise.all(
		lemmas
			.map((lemma, i) => [lemma, sentenceWords[i]])
			.filter(([lemma, encounteredForm]) => lemma != encounteredForm)
			.map(([lemma, encounteredForm]) => addWordToLemma(lemma, encounteredForm))
	);

	const indexOfWord = (word: string) => {
		const result = lemmas.indexOf(word);

		if (result === -1) {
			throw new Error(`Word ${word} not found in lemmas`);
		}
		return result;
	};

	const sentence = await sentences.addSentence({
		sentenceString,
		english,
		words: (words as { id: number; word: string | null }[])
			.concat(addedWords)
			.sort((a, b) => indexOfWord(a.word!) - indexOfWord(b.word!))
	});

	return sentence;
}
