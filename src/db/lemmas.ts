import { db } from './client';
import type * as DB from './types';

export async function addWordToLemma(wordString: string, word: DB.Word) {
	// insert into word_lemma unless it already exists
	const result = await db
		.insertInto('word_lemma')
		.values({ lemma_id: word.id, word: wordString })
		.onConflict((oc) => oc.columns(['lemma_id', 'word']).doNothing())
		.execute();

	if (result[0]?.numInsertedOrUpdatedRows) {
		console.log(`Adding lemma of ${wordString} -> ${word.word}`);
	}
}

export function getForms(wordId: number) {
	return db.selectFrom('word_lemma').select(['word']).where('lemma_id', '=', wordId).execute();
}

export function getLemmasOfWord(word: string) {
	return db
		.selectFrom('word_lemma')
		.where('word_lemma.word', '=', word.toLowerCase())
		.innerJoin('words', 'word_lemma.lemma_id', 'words.id')
		.selectAll()
		.execute();
}

export function getLemmaIdsOfWord(word: string) {
	return db
		.selectFrom('word_lemma')
		.select(['lemma_id'])
		.where('word', '=', word.toLowerCase())
		.execute();
}

export async function deleteWordToLemma(lemmaId: number, wordString: string) {
	console.log(`Deleting lemma of ${wordString} -> ${lemmaId}`);

	return db
		.deleteFrom('word_lemma')
		.where('lemma_id', '=', lemmaId)
		.where('word', '=', wordString.toLowerCase())
		.execute();
}
