import { Language } from '../logic/types';
import { db } from './client';
import { Word } from './types';
import { toWord } from './words';

export async function getWordRelations(wordId: number, language: Language): Promise<Word[]> {
	return (
		await db
			.withSchema(language.code)
			.selectFrom('word_relations')
			.innerJoin('words', 'related_word_id', 'id')
			.select(['word', 'id', 'level', 'type', 'unit'])
			.where('word_id', '=', wordId)
			.execute()
	).map(toWord);
}

export async function addWordRelations(
	fromWordId: number,
	toWordIds: number[],
	language: Language
): Promise<void> {
	if (toWordIds.length === 0) {
		return;
	}

	await db
		.withSchema(language.code)
		.insertInto('word_relations')
		.values(toWordIds.map((toWordId) => ({ word_id: fromWordId, related_word_id: toWordId })))
		.execute();
}
