import { parallelize } from '$lib/parallelize';
import { FRENCH, POLISH, SPANISH } from '../constants';
import { getWordsMissingExamples } from '../db/getWordsMissingExamples';
import { addWord, deleteWord } from '../db/words';
import { addSentencesForWord } from '../logic/addSentencesForWord';

const language = SPANISH;

export async function addSentencesForMissingWords() {
	await addWord('casa', { language });

	const words = await getWordsMissingExamples({
		minSentenceCount: 3,
		limit: 100,
		language
	});

	await parallelize(
		words.map((word) => async () => {
			try {
				return await addSentencesForWord(word, { language });
			} catch (e: any) {
				if (e.code == 'wrongLemma') {
					console.error(e.message);
				} else if (e.code == 'noValidSentencesFound') {
					console.error(`${e.message}. Deleting word ${word.word}...`);

					await deleteWord(word.id, language);
				} else {
					console.error(`FATAL For word: ${word.word} (${word.id}): ${e.message}`);
				}
			}
		}),
		2
	);
}

for (let i = 0; i < 5; i++) {
	await addSentencesForMissingWords();
}
