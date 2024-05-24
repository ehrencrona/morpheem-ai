import { db } from './client';

export async function addWrittenSentence({
	sentence,
	wordId,
	userId
}: {
	sentence: string;
	wordId: number;
	userId: number;
}) {
	await db
		.insertInto('written_sentences')
		.values({
			sentence,
			word_id: wordId,
			user_id: userId
		})
		.execute();
}

export async function getRecentWrittenSentences({ userId }: { userId: number }) {
	return db
		.selectFrom('written_sentences')
		.select(['sentence', 'word_id'])
		.where('user_id', '=', userId)
		.orderBy('time', 'desc')
		.limit(20)
		.execute();
}
