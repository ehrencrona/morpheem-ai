import { dateToTime } from '../logic/isomorphic/knowledge';
import { Language } from '../logic/types';
import { db } from './client';

export async function addSeenSentence(
	sentenceId: number,
	userId: number,
	language: Language
): Promise<void> {
	await db
		.withSchema(language.schema)
		.insertInto('sentences_seen')
		.values({ sentence_id: sentenceId, user_id: userId })
		.onConflict((oc) =>
			oc.columns(['sentence_id', 'user_id']).doUpdateSet({
				time: new Date()
			})
		)
		.execute();
}

export async function getLastSeen(
	sentenceIds: number[],
	language: Language
): Promise<(number | undefined)[]> {
	if (sentenceIds.length === 0) {
		return [];
	}

	const rows = await db
		.withSchema(language.schema)
		.selectFrom('sentences_seen')
		.select(['sentence_id', 'time'])
		.where('sentence_id', 'in', sentenceIds)
		.orderBy('time', 'desc')
		.execute();

	const lastSeen = new Map<number, number>();

	for (const row of rows) {
		lastSeen.set(row.sentence_id, dateToTime(row.time));
	}

	return sentenceIds.map((id) => lastSeen.get(id));
}
