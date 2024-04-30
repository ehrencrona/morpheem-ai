import { dateToTime } from '../logic/isomorphic/knowledge';
import { db } from './client';

export async function addSeenSentence(sentenceId: number, userId: number): Promise<void> {
	await db
		.insertInto('sentences_seen')
		.values({ sentence_id: sentenceId, user_id: userId })
		.onConflict((oc) =>
			oc.columns(['sentence_id', 'user_id']).doUpdateSet({
				time: new Date()
			})
		)
		.execute();
}

export async function getLastSeen(sentenceIds: number[]): Promise<(number | undefined)[]> {
	const rows = await db
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
