import { Word } from '../db/types';
import { addWordRelations, getWordRelations } from '../db/wordRelations';
import { Language } from './types';
import { findRelatedWords as findRelatedWordsAi } from '../ai/relatedWords';
import { getMultipleWordsByLemmas } from '../db/words';

export async function findRelatedWords(word: Word, language: Language): Promise<Word[]> {
	let related = await getWordRelations(word.id, language);

	if (related.length === 0) {
		const relatedWordStrings = await findRelatedWordsAi(word.word, language);

		related = await getMultipleWordsByLemmas(relatedWordStrings, language);

		console.log(
			`Related to ${word.word}: ${relatedWordStrings.join(', ')}. Fetch words from DB: ${related.map((word) => word.word).join(', ')}`
		);

		await addWordRelations(
			word.id,
			related.map((word) => word.id),
			language
		);
	}

	return related;
}
