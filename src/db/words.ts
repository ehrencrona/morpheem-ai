import { error } from '@sveltejs/kit';
import type { NotNull } from 'kysely';
import { Language, SentenceWord } from '../logic/types';
import { db } from './client';
import type * as DB from './types';
import { CodedError } from '../CodedError';
import { filterUndefineds } from '$lib/filterUndefineds';

export async function addWord(
	lemma: string,
	{ language, type }: { language: Language; type: DB.WordType | null }
): Promise<DB.Word> {
	if (!lemma) {
		throw new Error('Lemma cannot be empty');
	}

	if (['an', 'the', 'they', 'this', 'big'].includes(lemma)) {
		throw new CodedError(`"${lemma}" is English`, 'notALemma');
	}

	if (
		language.code == 'ko' &&
		[
			'이',
			'가',
			'을',
			'를',
			'은',
			'는',
			'에',
			'에서',
			'의',
			'로',
			'으로',
			'지만',
			'도',
			'까'
		].includes(lemma)
	) {
		throw new CodedError(
			`"${lemma}" is a particle, not a separate word (this can happen due to issues with word tokenization)`,
			'notALemma'
		);
	}

	if (
		language.code == 'pl' &&
		[
			'ta',
			'wielu',
			'można',
			'wszystki',
			'wszystkie',
			'zajęcia',
			'gdybyć',
			'cię',
			'jego',
			'ci',
			'mi',
			'ich',
			'ludzie',
			'ludzi'
		].includes(lemma)
	) {
		throw new CodedError(`"${lemma}" is not the dictionary form`, 'notALemma');
	}

	if (language.code == 'fr' && ['la', 'nos', 'les', 'ses', 'nos', 'une'].includes(lemma)) {
		throw new CodedError(`"${lemma}" is not the dictionary form`, 'notALemma');
	}

	if (language.code == 'nl' && ['je', 'onze'].includes(lemma)) {
		throw new CodedError(`"${lemma}" is not the dictionary form`, 'notALemma');
	}

	let result = await db
		.withSchema(language.schema)
		.insertInto('words')
		.values({
			word: lemma.toLowerCase(),
			type,
			json: undefined
		})
		.returning(['id', 'word', 'level', 'type'])
		.onConflict((oc) => oc.column('word').doNothing())
		.executeTakeFirst();

	if (!result) {
		result = await db
			.withSchema(language.schema)
			.selectFrom('words')
			.select(['id', 'word', 'level', 'type'])
			.where('word', '=', lemma.toLowerCase())
			.executeTakeFirst();
	} else {
		console.log(`Added word "${lemma}" (${result.id})${type != undefined ? ` (${type})` : ''}`);
	}

	return toWord(result!);
}

/** No guarantee as to all words existing! */
export async function getMultipleWordsByLemmas(
	lemmas: string[],
	language: Language
): Promise<DB.Word[]> {
	if (lemmas.length == 0) {
		return [];
	}

	const words = (
		await db
			.withSchema(language.schema)
			.selectFrom('words')
			.select(['id', 'word', 'level', 'type'])
			.where('word', 'in', lemmas)
			.execute()
	).map(toWord);

	const missingWords = lemmas.filter((lemma) => !words.some((word) => word.word == lemma));

	if (missingWords.length > 0) {
		console.warn(`Missing words during getMultipleWordsByLemmas: ${missingWords.join(', ')}`);
	}

	return filterUndefineds(lemmas.map((lemma) => words.find((word) => word.word == lemma)));
}

export async function getMultipleWordsByIds(
	wordIds: number[],
	language: Language
): Promise<DB.Word[]> {
	if (wordIds.length == 0) {
		return [];
	}

	return (
		await db
			.withSchema(language.schema)
			.selectFrom('words')
			.select(['id', 'word', 'type', 'level'])
			.where('id', 'in', wordIds)
			.execute()
	).map(toWord);
}

export async function getWords(
	orderBy: 'word asc' | 'id asc' | 'level asc',
	language: Language
): Promise<DB.Word[]> {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('words')
			.select(['id', 'word', 'type', 'level'])
			.orderBy(orderBy)
			.execute()
	).map(toWord);
}

export async function getWordCount(language: Language) {
	const res = await db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(({ fn }) => [fn.count('id').as('count')])
		.execute();

	return res[0].count as number;
}

export async function getWordIdsForCloze(language: Language, maxLevel: number) {
	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word'])
		.where((eb) => eb('type', 'is', null).or('type', 'not in', ['cognate', 'name']))
		.where('level', '<=', maxLevel)
		.execute();
}

export async function getWordsBelowLevel(level: number, language: Language): Promise<DB.Word[]> {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('words')
			.select(['id', 'word', 'type', 'level'])
			.where('level', '<', level)
			.orderBy('level asc')
			.execute()
	).map(toWord);
}

export async function getWordByLemma(lemma: string, language: Language): Promise<DB.Word> {
	const word = await db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'level', 'type'])
		.where('word', '=', lemma.toLowerCase())
		.executeTakeFirst();

	if (!word) {
		throw new CodedError(`Word with lemma ${lemma} not found`, 'noSuchWord');
	}

	return toWord(word);
}

export async function getWordById(wordId: number, language: Language): Promise<DB.Word> {
	const word = await db
		.withSchema(language.schema)
		.selectFrom('words')
		.select(['id', 'word', 'level', 'type'])
		.where('id', '=', wordId)
		.executeTakeFirst();

	if (!word) {
		throw error(404, `Word with id ${wordId} not found`);
	}

	return toWord(word);
}

export async function getWordsByPrefix(
	prefix: string,
	{ language, limit }: { language: Language; limit: number }
) {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('word_lemma')
			.innerJoin('words', 'lemma_id', 'id')
			.select(['words.word'])
			.where('word_lemma.word', 'like', `${prefix.toLowerCase()}%`)
			.orderBy('word asc')
			.groupBy('words.word')
			.limit(limit)
			.execute()
	).map(({ word }) => word);
}

export async function updateLemma(wordId: number, lemma: string, language: Language) {
	await db
		.withSchema(language.schema)
		.updateTable('words')
		.set({ word: lemma })
		.where('id', '=', wordId)
		.execute();

	return getWordById(wordId, language);
}

export async function deleteWord(wordId: number, language: Language) {
	await db.withSchema(language.schema).deleteFrom('words').where('id', '=', wordId).execute();
}

export async function getWordsOfSentence(
	sentenceId: number,
	language: Language
): Promise<SentenceWord[]> {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('word_sentences')
			.innerJoin('words', 'word_id', 'id')
			.select(['word', 'word_index', 'id', 'level', 'type'])
			.where('sentence_id', '=', sentenceId)
			.orderBy('word_index')
			.$narrowType<{ word: NotNull }>()
			.execute()
	).map(toSentenceWord);
}

export async function getWordsOfSentences(
	sentenceIds: number[],
	language: Language
): Promise<SentenceWord[][]> {
	if (sentenceIds.length == 0) {
		return [];
	}

	const rows = await db
		.withSchema(language.schema)
		.selectFrom('word_sentences')
		.innerJoin('words', 'word_id', 'id')
		.select(['word', 'word_index', 'id', 'level', 'type', 'sentence_id'])
		.where('sentence_id', 'in', sentenceIds)
		.orderBy(['sentence_id', 'word_index'])
		.$narrowType<{ word: NotNull }>()
		.execute();

	return sentenceIds
		.map((sentenceId) => rows.filter((row) => row.sentence_id == sentenceId))
		.map((s) => s.map(toSentenceWord));
}

export function toWord(row: {
	id: number;
	level: number;
	type: string | null;
	word: string;
}): DB.Word {
	return {
		id: row.id,
		word: row.word,
		level: row.level,
		type: row.type ? (row.type as DB.WordType) : undefined
	};
}

function toSentenceWord(row: {
	word: string;
	word_index: number;
	id: number;
	level: number;
	type: string | null;
}): SentenceWord {
	return {
		id: row.id,
		word: row.word,
		level: row.level,
		type: row.type ? (row.type as DB.WordType) : undefined,
		word_index: row.word_index
	};
}
