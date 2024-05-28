import { Language } from '../logic/types';
import { db } from './client';

export async function getActivity(userId: number, language: Language) {
	return db
		.withSchema(language.schema)
		.selectFrom('activity')
		.selectAll()
		.where('user_id', '=', userId)
		.orderBy('date', 'desc')
		.execute();
}

export async function storeWordsKnown({
	userId,
	read,
	write,
	language
}: {
	userId: number;
	read: number;
	write: number;
	language: Language;
}) {
	return db
		.withSchema(language.schema)
		.insertInto('activity')
		.values({
			user_id: userId,
			words_known: read,
			words_known_write: write
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'date']).doUpdateSet({
				words_known: read,
				words_known_write: write
			})
		)
		.execute();
}

export async function storeMinuteSpent(userId: number, language: Language) {
	return db
		.withSchema(language.schema)
		.insertInto('activity')
		.values({
			user_id: userId,
			minutes_spent: 1,
			words_known_write: 0,
			words_known: 0
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'date']).doUpdateSet((eb) => ({
				minutes_spent: eb('activity.minutes_spent', '+', 1)
			}))
		)
		.execute();
}

export async function storeSentenceDone(userId: number, language: Language) {
	return db
		.withSchema(language.schema)
		.insertInto('activity')
		.values({
			user_id: userId,
			sentences_done: 1,
			words_known_write: 0,
			words_known: 0
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'date']).doUpdateSet((eb) => ({
				sentences_done: eb('activity.sentences_done', '+', 1)
			}))
		)
		.execute();
}
