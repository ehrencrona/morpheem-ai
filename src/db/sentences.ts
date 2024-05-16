import { error } from '@sveltejs/kit';
import { db } from './client';
import type { Sentence } from './types';

export async function addSentence({
	sentenceString,
	english,
	words
}: {
	sentenceString: string;
	english: string;
	words: { id: number; word: string | null }[];
}): Promise<Sentence | undefined> {
	const sentence = await db.transaction().execute(async (trx) => {
		const sentence = await trx
			.insertInto('sentences')
			.values({ sentence: sentenceString, english })
			.returning(['id', 'sentence', 'english'])
			.onConflict((oc) => oc.column('sentence').doNothing())
			.executeTakeFirst();

		if (!sentence) {
			console.warn(`Sentence "${sentenceString}" already exists`);

			return undefined;
		}

		const { id } = sentence;

		const wordSentences = words.map((word, index) => ({
			word_id: word.id,
			sentence_id: id,
			word_index: index
		}));

		await trx.insertInto('word_sentences').values(wordSentences).execute();

		return sentence;
	});

	return sentence;
}

export function getSentences() {
	return db.selectFrom('sentences').select(['id', 'sentence']).orderBy('id asc').execute();
}

export function getSentenceIds() {
	return db.selectFrom('sentences').select(['id']).execute();
}

export async function getSentence(id: number) {
	const sentence = await db
		.selectFrom('sentences')
		.select(['id', 'sentence', 'english'])
		.where('id', '=', id)
		.executeTakeFirst();

	if (!sentence) {
		return error(404, 'Sentence not found');
	}

	return sentence;
}

export async function getSentencesWithWord(wordId: number): Promise<Sentence[]> {
	return db
		.selectFrom('word_sentences')
		.innerJoin('sentences', 'sentence_id', 'id')
		.select(['id', 'sentence', 'english'])
		.where('word_id', '=', wordId)
		.execute();
}

export async function deleteSentence(sentenceId: number) {
	await db.deleteFrom('sentences').where('id', '=', sentenceId).execute();
}
