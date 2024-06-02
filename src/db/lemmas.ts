import { Language } from '../logic/types';
import { db } from './client';
import type * as DB from './types';

export async function addWordToLemma(wordString: string, word: DB.Word, language: Language) {
	if (
		language.code == 'fr' &&
		['ils->il', 'elle->il', 'ce->ça'].includes(`${wordString}->${word.word}`)
	) {
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

export async function getLemmasOfWords(words: string[], language: Language) {
	const rows = await db
		.withSchema(language.schema)
		.selectFrom('word_lemma')
		.where(
			'word_lemma.word',
			'in',
			words.map((word) => word.toLowerCase())
		)
		.innerJoin('words', 'word_lemma.lemma_id', 'words.id')
		.select(['words.id', 'words.word', 'cognate', 'level', 'word_lemma.word as inflected'])
		.execute();

	return words.map((word) => rows.filter((row) => row.inflected == word.toLowerCase()));
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
