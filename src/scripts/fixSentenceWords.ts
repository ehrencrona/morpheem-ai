import { CodedError } from '../CodedError';
import { FRENCH, POLISH } from '../constants';
import { db } from '../db/client';
import { getLemmasOfWord } from '../db/lemmas';
import { deleteSentence, getSentences } from '../db/sentences';
import { getWordsOfSentence } from '../db/words';
import { getSentenceWords } from '../logic/addSentence';
import { lemmatizeSentences } from '../logic/lemmatize';
import { toWords } from '../logic/toWords';

async function fixSentenceWords() {
	const language = POLISH;

	const sentences = await getSentences(language);

	for (const sentence of sentences) {
		const currentWords = await getWordsOfSentence(sentence.id, language);

		const wordStrings = toWords(sentence.sentence, language);

		let isCorrect = true;

		if (currentWords.length != wordStrings.length) {
			isCorrect = false;
		} else {
			for (let i = 0; i < wordStrings.length; i++) {
				const wordString = wordStrings[i];
				const lemmas = await getLemmasOfWord(wordString, language);

				if (!lemmas.some(({ word }) => word == currentWords[i].word)) {
					isCorrect = false;
				}
			}
		}

		if (!isCorrect) {
			try {
				const lemmas = await lemmatizeSentences([sentence.sentence], language);

				const words = await getSentenceWords(sentence.sentence, lemmas[0], language);

				const wordSentences = words.map((word, index) => ({
					word_id: word.id,
					sentence_id: sentence.id,
					word_index: index
				}));

				console.log(`*** ${sentence.id} ${sentence.sentence}`);

				for (const word of currentWords) {
					console.log(`<-  ${word.id} ${word.word}`);
				}

				for (const word of words) {
					console.log(`-> ${word.id} ${word.word}`);
				}

				await db.transaction().execute(async (trx) => {
					await trx
						.withSchema(language.schema)
						.deleteFrom('word_sentences')
						.where('sentence_id', '=', sentence.id)
						.execute();

					await trx
						.withSchema(language.schema)
						.insertInto('word_sentences')
						.values(wordSentences)
						.execute();
				});
			} catch (e) {
				if ((e as CodedError).code == 'noLemmaFound') {
					console.log(e);

					deleteSentence(sentence.id, language);
				} else {
					throw e;
				}
			}
		}
	}
}

fixSentenceWords();
