import { FRENCH } from '../constants';
import { db } from '../db/client';
import { getSentences } from '../db/sentences';
import { getWordsOfSentence } from '../db/words';
import { getSentenceWords } from '../logic/addSentence';
import { toWordStrings } from '../logic/toWordStrings';

async function addMissingSentenceWords() {
	const language = FRENCH;

	const sentences = await getSentences(language);

	for (const sentence of sentences) {
		const currentWords = await getWordsOfSentence(sentence.id, language);

		const wordStrings = toWordStrings(sentence.sentence, language);

		if (currentWords.length != wordStrings.length) {
			const words = await getSentenceWords(sentence.sentence, { language, throwOnError: true });

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
		}
	}
}

addMissingSentenceWords();
