import { Language } from '../logic/types';
import { db } from './client';

export function addWordTranslations({
	wordId,
	sentenceId,
	english,
	language,
	form
}: {
	wordId: number;
	sentenceId?: number;
	english: string;
	language: Language;
	form?: string;
}) {
	return db
		.withSchema(language.schema)
		.insertInto('word_translations')
		.values({
			word_id: wordId,
			sentence_id: sentenceId,
			english,
			form
		})
		.execute();
}

export function getAllWordTranslations(wordId: number, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('word_translations')
		.where('word_id', '=', wordId)
		.selectAll()
		.execute();
}

export function getWordTranslation(wordId: number, sentenceId: number | null, language: Language) {
	let select = db
		.withSchema(language.schema)
		.selectFrom('word_translations')
		.selectAll()
		.where('word_id', '=', wordId);

	if (sentenceId != null) {
		select = select.where('sentence_id', '=', sentenceId);
	} else {
		select = select.where('sentence_id', 'is', null);
	}

	return select
		.executeTakeFirst()
		.then((res) => (res ? { ...res, form: res.form || undefined } : undefined));
}
