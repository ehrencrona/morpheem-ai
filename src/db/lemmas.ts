import { toWords } from '../logic/toWords';
import { Language } from '../logic/types';
import { db } from './client';
import type * as DB from './types';
import { toWord } from './words';

export async function addWordToLemma(wordString: string, word: DB.Word, language: Language) {
	if (
		language.code == 'fr' &&
		['ils->il', 'elle->il', 'ce->ça'].includes(`${wordString}->${word.word}`)
	) {
		throw new Error(`${word.word} is not the dictionary form of ${wordString}`);
	}

	if (
		language.code == 'es' &&
		['se->ser', 'al->el', 'me->yo', 'me->mí', 'esta->estar'].includes(`${wordString}->${word.word}`)
	) {
		throw new Error(`${word.word} is not the dictionary form of ${wordString}`);
	}

	if (language.code == 'nl' && ['mee->met'].includes(`${wordString}->${word.word}`)) {
		throw new Error(`${word.word} is not the dictionary form of ${wordString}`);
	}

	// insert into word_lemma unless it already exists
	const result = await db
		.withSchema(language.schema)
		.insertInto('word_lemma')
		.values({ lemma_id: word.id, word: wordString })
		.onConflict((oc) => oc.columns(['lemma_id', 'word']).doNothing())
		.execute();

	if (result[0]?.numInsertedOrUpdatedRows) {
		if (wordString != word.word) {
			console.log(`Adding lemma of ${wordString} -> ${word.word}`);
		}
	}
}

export function getForms(wordId: number, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('word_lemma')
		.select(['word'])
		.where('lemma_id', '=', wordId)
		.execute();
}

export function getLemmasOfWord(word: string, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('word_lemma')
		.where('word_lemma.word', '=', word.toLowerCase())
		.innerJoin('words', 'word_lemma.lemma_id', 'words.id')
		.selectAll()
		.execute();
}

export async function getInflections(wordId: number, language: Language) {
	return (
		await db
			.withSchema(language.schema)
			.selectFrom('word_lemma')
			.where('lemma_id', '=', wordId)
			.select(['word'])
			.orderBy('word')
			.execute()
	).map((row) => row.word);
}

/** Returns an array with possible lemmas for each word. The array for a word may have length zero */
export async function getLemmasOfWords(words: string[], language: Language): Promise<DB.Word[][]> {
	if (words.length == 0) {
		return [];
	}

	const rows = await db
		.withSchema(language.schema)
		.selectFrom('word_lemma')
		.where(
			'word_lemma.word',
			'in',
			words.map((word) => word.toLowerCase())
		)
		.innerJoin('words', 'word_lemma.lemma_id', 'words.id')
		.select(['words.id', 'words.word', 'type', 'level', 'word_lemma.word as inflected'])
		.execute();

	return words
		.map((word) => rows.filter((row) => row.inflected == word.toLowerCase()))
		.map((rows) => rows.map(toWord));
}

export function getLemmaIdsOfWord(word: string, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('word_lemma')
		.select(['lemma_id'])
		.where('word', '=', word.toLowerCase())
		.execute();
}

export async function deleteWordToLemma(lemmaId: number, wordString: string, language: Language) {
	console.log(`Deleting lemma of ${wordString} -> ${lemmaId}`);

	return db
		.withSchema(language.schema)
		.deleteFrom('word_lemma')
		.where('lemma_id', '=', lemmaId)
		.where('word', '=', wordString.toLowerCase())
		.execute();
}
