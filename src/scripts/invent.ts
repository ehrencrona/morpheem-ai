import { isContextProvided } from '../ai/isContextProvided';
import { getWordByLemma } from '../db/words';
import { inventExampleSentences } from '../logic/inventExampleSentences';

async function invent() {
	const word = await getWordByLemma('zjawić');

	const sentences = await inventExampleSentences(word.word, undefined);

	const icp = await isContextProvided(sentences[0].sentence, word, sentences[0].lemmas);

	console.log({ icp });
}

invent();
