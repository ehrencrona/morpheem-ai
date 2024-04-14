import { getExampleSentences } from '../ai/getExampleSentences';
import { sentencesToLemmas } from '../ai/sentencesToLemmas';
import { addWord } from '../db/words';
import { addSentence } from '../logic/addSentence';
import { getWordsMissingExamples } from '../db/getWordsMissingExamples';
import { translate } from '../ai/translate';

export async function recursivelyAddWords() {
	//	await addWord('piękny', 'pretty', undefined);

	const words = await getWordsMissingExamples(4);

	for (const word of words) {
		const sentences = await getExampleSentences(word);
		const englishes = await translate(sentences);
		const lemmatized = await sentencesToLemmas(sentences);

		await Promise.all(
			sentences.map(async (sentence, i) => {
				await addSentence(sentence, englishes[i], lemmatized[i]);
			})
		);
	}
}

recursivelyAddWords();
