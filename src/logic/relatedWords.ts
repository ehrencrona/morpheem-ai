import { findRelatedWords as findRelatedWordsAi } from '../ai/relatedWords';
import { Word } from '../db/types';
import { addWordRelations, getWordRelations } from '../db/wordRelations';
import { getMultipleWordsByLemmas } from '../db/words';
import { Language } from './types';

export async function findRelatedWords(word: Word, language: Language): Promise<Word[]> {
	let related = await getWordRelations(word.id, language);

	if (related == undefined) {
		const relatedWordStrings = await findRelatedWordsAi(word.word, language);

		related = await getMultipleWordsByLemmas(relatedWordStrings, language);

		console.log(
			`Related to ${word.word}: ${
				relatedWordStrings.join(', ') || 'none'
			}. Known: ${related.map(({ word, id }) => `${word} (${id})`).join(', ')}`
		);

		await addWordRelations(
			word.id,
			related.map((word) => word.id),
			language
		);
	}

	return related;
}
