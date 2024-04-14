import { db } from './client';

export function addKnowledge({
	wordId,
	sentenceId,
	userId,
	isKnown
}: {
	wordId: number;
	sentenceId: number;
	userId: number;
	isKnown: boolean;
}) {
	return db
		.insertInto('knowledge')
		.values({
			word_id: wordId,
			sentence_id: sentenceId,
			user_id: userId,
			knew: isKnown
		})
		.execute();
}
