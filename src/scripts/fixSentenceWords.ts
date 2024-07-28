import { logError } from '$lib/logError';
import { parallelize } from '$lib/parallelize';
import { zip } from '$lib/zip';
import { CodedError } from '../CodedError';
import { POLISH, SWEDISH } from '../constants';
import { db } from '../db/client';
import { getLemmasOfWords } from '../db/lemmas';
import { deleteSentence, getSentences } from '../db/sentences';
import * as DB from '../db/types';
import { getWordsOfSentences } from '../db/words';
import { getSentencesWords } from '../logic/addSentence';
import { toWordStrings } from '../logic/toWordStrings';
import { SentenceWord } from '../logic/types';

const language = SWEDISH;

async function fixSentenceWords() {
	const sentences = await getSentences(language);

	let count = 0,
		fixedCount = 0;

	const words = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	let incorrect: (DB.Sentence & { words: SentenceWord[] })[] = [];

	await parallelize(
		sentences.map((sentence, i) => async () => {
			const sentenceWords = words[i];

			const wordStrings = toWordStrings(sentence.sentence, language);

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
				incorrect.push({ ...sentence, words: sentenceWords });
			}

			count++;

			if (count % 100 == 0) {
				console.log(`${count} sentences scanned, ${incorrect.length} have issues...`);
			}
		}),
		20
	);

	console.log(`Done scanning. ${count} sentences scanned, ${incorrect.length} have issues.`);

	let deleteCount = 0;

	for (const batch of toBatches(incorrect, 10)) {
		const sentencesWords = await getSentencesWords(
			batch.map(({ sentence }) => sentence),
			undefined,
			{ language, throwOnError: false }
		);

		for (const [sentence, words] of zip(batch, sentencesWords)) {
			if (words.length == 0) {
				console.error(`Failed to lemmatize sentence ${sentence.id}.`);

				deleteSentence(sentence.id, language);
				deleteCount++;

				continue;
			}

			try {
				const wordSentences = words.map((word, index) => ({
					word_id: word.id,
					sentence_id: sentence.id,
					word_index: index
				}));

				console.log(`*** ${sentence.id} ${sentence.sentence}`);

				for (const word of sentence.words) {
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
					deleteCount++;
				} else if ((e as CodedError).code == 'notALemma') {
					console.error(`In sentence ${sentence.id}: ${(e as CodedError).message}`);
				} else {
					logError(e, `Error in sentence ${sentence.id}`);
				}
			}
		}
	}

	console.log(
		`Done. ${count} sentences processed, ${incorrect.length} had issues, ${fixedCount} fixed, ${deleteCount} deleted.`
	);
}

function toBatches<T>(arr: T[], batchSize: number): T[][] {
	const batches: T[][] = [];

	for (let i = 0; i < arr.length; i += batchSize) {
		batches.push(arr.slice(i, i + batchSize));
	}

	return batches;
}

fixSentenceWords();
