import { lemmatizeSentences } from '../ai/lemmatize';
import { addWordToLemma, getLemmaIdsOfWord } from '../db/lemmas';
import { getSentence } from '../db/sentences';
import { addWord, getWordsOfSentence } from '../db/words';
import { toWords } from './toWords';

/**
 * @param wordString The word as it appears in the sentence.
 */
export async function getWordInSentence(wordString: string, sentenceId: number) {
	wordString = wordString.toLowerCase();

	const lemmaIds = (await getLemmaIdsOfWord(wordString)).reduce((acc, { lemma_id }) => {
		acc.add(lemma_id);
		return acc;
	}, new Set<number>());

	if (lemmaIds.size === 0) {
		console.log(`Word "${wordString}" not found in word forms, adding...`);

		const sentence = await getSentence(sentenceId);
		const wordStrings = toWords(sentence.sentence);

		const [lemmas] = await lemmatizeSentences([sentence.sentence]);

		const index = wordStrings.indexOf(wordString);

		if (index < 0) {
			throw new Error(
				`Word "${wordString}" not found in sentence "${sentence.sentence}", only ${wordStrings.join(', ')}`
			);
		}

		const lemma = lemmas[index];

		const word = await addWord(lemma);

		await addWordToLemma(wordString, word);

		return word;
	}

	const words = await getWordsOfSentence(sentenceId);

	const word = words.find((w) => lemmaIds.has(w.id) || w.word === wordString);

	if (!word) {
		throw new Error(
			`Word "${wordString}" not found in sentence ${sentenceId}, only ${words.map((w) => w.word).join(', ')}`
		);
	}

	return word;
}
