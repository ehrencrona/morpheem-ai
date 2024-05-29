import { lemmatizeSentences } from '../ai/lemmatize';
import { addWordToLemma, getLemmaIdsOfWord } from '../db/lemmas';
import { getSentence } from '../db/sentences';
import { addWord, getWordsOfSentence } from '../db/words';
import { toWords } from './toWords';
import { Language } from './types';

/**
 * @param wordString The word as it appears in the sentence.
 */
export async function getWordInSentence(
	wordString: string,
	sentenceId: number,
	language: Language
) {
	wordString = wordString.toLowerCase();

	const lemmaIds = (await getLemmaIdsOfWord(wordString, language)).reduce((acc, { lemma_id }) => {
		acc.add(lemma_id);
		return acc;
	}, new Set<number>());

	if (lemmaIds.size === 0) {
		console.log(`Word "${wordString}" not found in word forms, adding...`);

		const sentence = await getSentence(sentenceId, language);
		const wordStrings = toWords(sentence.sentence, language);

		const [lemmas] = await lemmatizeSentences([sentence.sentence], { language });

		const index = wordStrings.indexOf(wordString);

		if (index < 0) {
			throw new Error(
				`Word "${wordString}" not found in sentence "${sentence.sentence}", only ${wordStrings.join(', ')}`
			);
		}

		const lemma = lemmas[index];

		const word = await addWord(lemma, { language });

		await addWordToLemma(wordString, word, language);

		return word;
	}

	const words = await getWordsOfSentence(sentenceId, language);

	const word = words.find((w) => lemmaIds.has(w.id) || w.word === wordString);

	if (!word) {
		throw new Error(
			`Word "${wordString}" not found in sentence ${sentenceId}, only ${words.map((w) => w.word).join(', ')}`
		);
	}

	return word;
}
