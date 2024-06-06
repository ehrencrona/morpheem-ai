import { addWordToLemma, getLemmaIdsOfWord } from '../db/lemmas';
import { getSentence } from '../db/sentences';
import { addWord } from '../db/words';
import { lemmatizeSentences } from '../logic/lemmatize';
import { toWords } from './toWords';
import { Language, SentenceWord } from './types';

/**
 * @param wordString The word as it appears in the sentence.
 */
export async function getWordInSentence(
	wordString: string,
	sentenceId: number | undefined,
	sentenceWords: SentenceWord[],
	language: Language
) {
	wordString = wordString.toLowerCase();

	const lemmaIds = (await getLemmaIdsOfWord(wordString, language)).reduce((acc, { lemma_id }) => {
		acc.add(lemma_id);
		return acc;
	}, new Set<number>());

	if (lemmaIds.size === 0) {
		if (!sentenceId) {
			throw new Error(
				`sentenceId is required when word (${wordString}) is not found in word forms`
			);
		}

		console.log(`Word "${wordString}" not found in word forms, adding...`);

		const sentence = await getSentence(sentenceId, language);
		const wordStrings = toWords(sentence.sentence, language);

		const [lemmas] = await lemmatizeSentences([sentence.sentence], { language });

		let index = wordStrings.indexOf(wordString);

		if (index < 0) {
			index = lemmas.indexOf(wordString);

			if (index < 0) {
				throw new Error(
					`Word "${wordString}" not found in sentence "${sentence.sentence}", only ${wordStrings.join(', ')}`
				);
			}
		}

		const lemma = lemmas[index];

		// does nothing if the lemma already exists
		const word = await addWord(lemma, { language });

		await addWordToLemma(wordString, word, language);

		return word;
	}

	const word = sentenceWords.find((w) => lemmaIds.has(w.id) || w.word === wordString);

	if (!word) {
		throw new Error(
			`Word "${wordString}" not found in sentence ${sentenceId}, only ${sentenceWords.map((w) => w.word).join(', ')}`
		);
	}

	return word;
}
