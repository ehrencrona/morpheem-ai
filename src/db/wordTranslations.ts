import { TranslatedWord } from '../ai/translate';
import { Language } from '../logic/types';
import { db } from './client';

export function addWordTranslation({
	wordId,
	sentenceId,
	inflected,
	english,
	language,
	form,
	transliteration,
	expression
}: {
	wordId: number;
	sentenceId: number | undefined;
	inflected: string;
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
			inflected,
			english,
			form,
			transliteration,
			expression: expression?.expression,
			expression_english: expression?.english
		})
		.execute();
}

export async function getAllWordTranslations({
	wordId,
	language,
	inflected
}: {
	wordId: number;
	inflected: string | undefined;
	language: Language;
}) {
	let query = db
		.withSchema(language.schema)
		.selectFrom('word_translations')
		.where('word_id', '=', wordId);

	if (inflected) {
		query = query.where('inflected', '=', inflected);
	}

	return (await query.selectAll().execute()).map(toTranslatedWord);
}

export async function getWordTranslation(
	wordId: number,
	sentenceId: number | null,
	language: Language
): Promise<TranslatedWord | undefined> {
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
		return toTranslatedWord(res);
	}
}

function toTranslatedWord(res: {
	word_id: number;
	sentence_id: number | null;
	inflected: string | null;
	english: string;
	form: string | null;
	transliteration: string | null;
	expression: string | null;
	expression_english: string | null;
}) {
	return {
		...res,
		form: res.form || undefined,
		transliteration: res.transliteration || undefined,
		inflected: res.inflected || undefined,
		expression: res.expression
			? {
					expression: res.expression,
					english: res.expression_english || ''
				}
			: undefined
	};
}
