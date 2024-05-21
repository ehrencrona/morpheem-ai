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
