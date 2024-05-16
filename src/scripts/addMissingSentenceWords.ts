import { lemmatizeSentences } from '../logic/lemmatize';
import { db } from '../db/client';
import { getSentences } from '../db/sentences';
import { getWordsOfSentence } from '../db/words';
import { getSentenceWords } from '../logic/addSentence';
import { toWords } from '../logic/toWords';

async function addMissingSentenceWords() {
	const sentences = await getSentences();

	for (const sentence of sentences) {
		const currentWords = await getWordsOfSentence(sentence.id);

		const wordStrings = toWords(sentence.sentence);

		if (currentWords.length != wordStrings.length) {
			const lemmas = await lemmatizeSentences([sentence.sentence]);

			const words = await getSentenceWords(sentence.sentence, lemmas[0]);

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
				await trx.deleteFrom('word_sentences').where('sentence_id', '=', sentence.id).execute();

				await trx.insertInto('word_sentences').values(wordSentences).execute();
			});
		}
	}
}

addMissingSentenceWords();
