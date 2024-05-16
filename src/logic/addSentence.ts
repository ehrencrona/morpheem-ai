import { addWordToLemma, getLemmasOfWord } from '../db/lemmas';
import { addWord, getMultipleWordsByLemmas } from '../db/words';
import { toWords } from './toWords';

import * as sentences from '../db/sentences';

export async function addSentence(sentenceString: string, english: string, lemmas: string[]) {
	console.log(`Adding sentence "${sentenceString}" (lemmas: ${lemmas.join(' ')})...`);

	return sentences.addSentence({
		sentenceString,
		english,
		words: await getSentenceWords(sentenceString, lemmas)
	});
}

export async function getSentenceWords(sentenceString: string, lemmas: string[]) {
	const wordStrings = toWords(sentenceString);

	if (wordStrings.length !== lemmas.length) {
		throw new Error(
			`Number of words does not match number of lemmas:\n${sentenceString}\n${lemmas.join(' ')}`
		);
	}

	let words = await getMultipleWordsByLemmas(lemmas);

	let missingWords = lemmas.filter((lemma) => !words.some((word) => word.word == lemma));

	for (const missingWord of missingWords) {
		const wordLemmas = await getLemmasOfWord(missingWord);

		if (wordLemmas.length > 0) {
			const rightLemma = wordLemmas[0];

			console.warn(
				`Wanted to add ${missingWord} as a new word, but it is probably a not a lemma; rather ${wordLemmas.map(({ word }) => word).join(' / ')} is, so using that instead.`
			);

			words.push(rightLemma);

			lemmas = lemmas.map((lemma) => (lemma === missingWord ? rightLemma.word! : lemma));
		}
	}

	missingWords = lemmas.filter((lemma) => !words.some((word) => word.word == lemma));

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

	return lemmas.map((lemma, index) => {
		const word = words.find((w) => w.word === lemma);

		if (!word) {
			throw new Error(`Word ${lemma} not found in words`);
		}

		return {
			...word,
			word_index: index
		};
	});
}
