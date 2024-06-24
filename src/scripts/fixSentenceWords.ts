import { parallelize } from '$lib/parallelize';
import { CodedError } from '../CodedError';
import { FRENCH, KOREAN } from '../constants';
import { db } from '../db/client';
import { getLemmasOfWords } from '../db/lemmas';
import { deleteSentence, getSentences } from '../db/sentences';
import { getWordsOfSentences } from '../db/words';
import { getSentenceWords } from '../logic/addSentence';
import { lemmatizeSentences } from '../logic/lemmatize';
import { toWords } from '../logic/toWords';

const language = KOREAN;

async function fixSentenceWords() {
	const sentences = await getSentences(language);

	let count = 0,
		fixedCount = 0;

	const words = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	await parallelize(
		sentences.map((sentence, i) => async () => {
			const sentenceWords = words[i];

			const wordStrings = toWords(sentence.sentence, language);

			let isCorrect = true;

			if (sentenceWords.length != wordStrings.length) {
				isCorrect = false;
			} else {
				const lemmasOfWord = await getLemmasOfWords(wordStrings, language);

				for (let i = 0; i < wordStrings.length; i++) {
					if (!lemmasOfWord[i].some(({ word }) => word == sentenceWords[i].word)) {
						isCorrect = false;
					}
				}
			}

			if (!isCorrect) {
				try {
					const words = await getSentenceWords(sentence.sentence, { language });

					const wordSentences = words.map((word, index) => ({
						word_id: word.id,
						sentence_id: sentence.id,
						word_index: index
					}));

					console.log(`*** ${sentence.id} ${sentence.sentence}`);

					for (const word of sentenceWords) {
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

					fixedCount++;
				} catch (e) {
					if ((e as CodedError).code == 'noLemmaFound') {
						console.error(e);

						deleteSentence(sentence.id, language);
					} else if ((e as CodedError).code == 'notALemma') {
						console.error(`In sentence ${sentence.id}: ${(e as CodedError).message}`);
					} else {
						throw e;
					}
				}
			}

			count++;

			if (count % 100 == 0) {
				console.log(`${count} sentences processed, ${fixedCount} fixed...`);
			}
		}),
		20
	);

	console.log(`Done. ${count} sentences processed, ${fixedCount} fixed.`);
}

fixSentenceWords();
