import { Language } from '../logic/types';
import { db } from './client';

export function addWordTranslations({
	wordId,
	sentenceId,
	english,
	language,
	form,
	transliteration,
	expression
}: {
	wordId: number;
	sentenceId: number | undefined;
	english: string;
	language: Language;
	form?: string;
	transliteration?: string;
	expression?: { expression: string; english: string };
}) {
	return db
		.withSchema(language.schema)
		.insertInto('word_translations')
		.values({
			word_id: wordId,
			sentence_id: sentenceId,
			english,
			form,
			transliteration,
			expression: expression?.expression,
			expression_english: expression?.english
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

export async function getWordTranslation(
	wordId: number,
	sentenceId: number | null,
	language: Language
) {
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

	const res = await select.executeTakeFirst();

	if (res) {
		return {
			...res,
			form: res.form || undefined,
			transliteration: res.transliteration || undefined,
			expression: res.expression
				? {
						expression: res.expression,
						english: res.expression_english || ''
					}
				: undefined
		};
	}
}
