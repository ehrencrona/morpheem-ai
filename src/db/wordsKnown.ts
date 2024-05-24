import { db } from './client';

export async function getActivity(userId: number) {
	return db
		.selectFrom('activity')
		.selectAll()
		.where('user_id', '=', userId)
		.orderBy('date', 'desc')
		.execute();
}

export async function storeWordsKnown(userId: number, size: number) {
	return db
		.insertInto('activity')
		.values({
			user_id: userId,
			words_known: size
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'date']).doUpdateSet({
				words_known: size
			})
		)
		.execute();
}

export async function storeMinuteSpent(userId: number) {
	return db
		.insertInto('activity')
		.values({
			user_id: userId,
			minutes_spent: 1,
			words_known: 0
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'date']).doUpdateSet((eb) => ({
				minutes_spent: eb('activity.minutes_spent', '+', 1)
			}))
		)
		.execute();
}

export async function storeSentenceDone(userId: number) {
	return db
		.insertInto('activity')
		.values({
			user_id: userId,
			sentences_done: 1,
			words_known: 0
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'date']).doUpdateSet((eb) => ({
				sentences_done: eb('activity.sentences_done', '+', 1)
			}))
		)
		.execute();
}
