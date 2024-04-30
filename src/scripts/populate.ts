import { getWordsMissingExamples } from '../db/getWordsMissingExamples';
import { addSentencesForWord } from '../logic/addSentencesForWord';
import { parallelize } from '../logic/knowledge';

export async function recursivelyAddWords() {
	//	await addWord('piękny', 'pretty', undefined);

	const words = await getWordsMissingExamples(20);

	await parallelize(
		words.map((word) => () => addSentencesForWord(word)),
		4
	);
}

recursivelyAddWords();
