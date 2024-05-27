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
	let select = db.selectFrom('word_translations').selectAll().where('word_id', '=', wordId);

	if (sentenceId !== null) {
		select = select.where('sentence_id', '=', sentenceId);
	} else {
		select = select.where('sentence_id', 'is', null);
	}

	return select.executeTakeFirst();
}
