import { expect, test } from 'vitest';
import { addSentencesForWord } from './addSentencesForWord';
import { getSentence } from '../db/sentences';
import { getWordsOfSentence } from '../db/words';
import { getLemmaIdsOfWord } from '../db/lemmas';
import { toWords } from './toWords';

test('addSentencesForWord', async ({}) => {
	const lemma = 'odcinek';
	const { id: sentenceId } = (
		await addSentencesForWord({ word: lemma, id: 4711, cognate: false, level: 100 }, { count: 1 })
	)[0];

	if (!sentenceId) {
		throw new Error('No new sentence was added');
	}

	const sentence = await getSentence(sentenceId);

	const words = await getWordsOfSentence(sentenceId);

	if (!words.find(({ word }) => word === lemma)) {
		throw new Error(
			`The sentence did not contain ${lemma}, only ${words.map(({ word }) => word).join(', ')}`
		);
	}

	expect(words.length).toEqual(toWords(sentence.sentence).length);

	for (const wordString of toWords(sentence.sentence)) {
		expect((await getLemmaIdsOfWord(wordString)).length).toBeGreaterThan(0);
	}
});
