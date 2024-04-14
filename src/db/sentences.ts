import { error } from '@sveltejs/kit';
import { db } from './client';

export function addSentence({
	sentenceString,
	english,
	words
}: {
	sentenceString: string;
	english: string;
	words: { id: number; word: string | null }[];
}) {
	return db.transaction().execute(async (trx) => {
		const sentence = await trx
			.insertInto('sentences')
			.values({ sentence: sentenceString, english })
			.returning('id')
			.onConflict((oc) => oc.column('sentence').doNothing())
			.executeTakeFirst();

		if (!sentence) {
			console.warn(`Sentence "${sentenceString}" already exists`);

			return;
		}

		const { id } = sentence!;

		const wordSentences = words.map((word, index) => ({
			word_id: word.id,
			sentence_id: id,
			word_index: index
		}));

		await trx
			.insertInto('word_sentences')
			.values(wordSentences)
			.onConflict((oc) => oc.columns(['word_id', 'sentence_id']).doNothing())
			.execute();

		return id;
	});
}

export function getSentences() {
	return db.selectFrom('sentences').select(['id', 'sentence']).execute();
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

export async function getSentencesWithWord(wordId: number) {
	return db
		.selectFrom('word_sentences')
		.leftJoin('sentences', 'sentence_id', 'id')
		.select(['sentence', 'id'])
		.where('word_id', '=', wordId)
		.execute();
}
