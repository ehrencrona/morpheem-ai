import { db } from './client';

export function addWordTranslations({
	wordId,
	sentenceId,
	english
}: {
	wordId: number;
	sentenceId?: number;
	english: string;
}) {
	return db
		.insertInto('word_translations')
		.values({
			word_id: wordId,
			sentence_id: sentenceId,
			english
		})
		.execute();
}

export function getAllWordTranslations(wordId: number) {
	return db.selectFrom('word_translations').where('word_id', '=', wordId).selectAll().execute();
}

export function getWordTranslation(wordId: number, sentenceId: number | null) {
	return db
		.selectFrom('word_translations')
		.where('word_id', '=', wordId)
		.where('sentence_id', '=', sentenceId)
		.selectAll()
		.executeTakeFirst();
}
