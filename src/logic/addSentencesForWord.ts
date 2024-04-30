import { getExampleSentences } from '../ai/getExampleSentences';
import { sentencesToLemmas } from '../ai/sentencesToLemmas';
import { translateSentences } from '../ai/translate';
import { addSentence } from './addSentence';

export async function addSentencesForWord(word: string, count: number = 5) {
	const sentences = await getExampleSentences(word, count);

	const [englishes, lemmatized] = await Promise.all([
		translateSentences(sentences),
		sentencesToLemmas(sentences)
	]);

	await Promise.all(
		sentences.map(async (sentence, i) => {
			await addSentence(sentence, englishes[i], lemmatized[i]);
		})
	);
}
