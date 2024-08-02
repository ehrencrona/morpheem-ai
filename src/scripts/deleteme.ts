import { FRENCH } from '../constants';
import { addWordToLemma } from '../db/lemmas';
import { getWordByLemma } from '../db/words';

const language = FRENCH;
const words = ['qualifié', 'ouvert'];

for (const wordString of words) {
	const word = await getWordByLemma(wordString, language);

	await addWordToLemma(wordString, word, language);
}
