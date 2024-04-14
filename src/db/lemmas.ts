import { db } from './client';

export async function addWordToLemma(lemma: string, encounteredForm: string) {
	console.log(`Adding lemma of ${encounteredForm} -> ${lemma}`);

	const res = await db
		.selectFrom('words')
		.select(['id'])
		.where('word', '=', lemma)
		.executeTakeFirst();

	if (!res) {
		console.warn(`Word ${lemma} not found when adding form ${encounteredForm}`);
		return;
	}

	const { id: lemmaId } = res;

	// insert into word_lemma unless it already exists
	await db
		.insertInto('word_lemma')
		.values({ lemma_id: lemmaId, word: encounteredForm })
		.onConflict((oc) => oc.columns(['lemma_id', 'word']).doNothing())
		.execute();
}

export function getForms(wordId: number) {
	return db.selectFrom('word_lemma').select(['word']).where('lemma_id', '=', wordId).execute();
}
