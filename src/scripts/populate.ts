import { POLISH } from '../constants';
import { getWordsMissingExamples } from '../db/getWordsMissingExamples';
import { deleteWord } from '../db/words';
import { addSentencesForWord } from '../logic/addSentencesForWord';
import { parallelize } from '../logic/knowledge';

export async function addSentencesForMissingWords() {
	//	await addWord('piękny', 'pretty', undefined);

	const language = POLISH;

	const words = await getWordsMissingExamples({
		minSentenceCount: 3,
		limit: 100,
		language
	});

	await parallelize(
		words.map((word) => async () => {
			try {
				return await addSentencesForWord(word, { userId: 4711, language });
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
		5
	);
}

for (let i = 0; i < 10; i++) {
	await addSentencesForMissingWords();
}
