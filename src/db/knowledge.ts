import { dateToTime } from '../logic/isomorphic/knowledge';
import type { AggKnowledgeForUser } from '../logic/types';
import { db } from './client';

export function addKnowledge({
	wordId,
	sentenceId,
	userId,
	isKnown,
	studiedWordId,
	type
}: {
	wordId: number;
	sentenceId?: number;
	userId: number;
	isKnown: boolean;
	studiedWordId: number;
	type: number;
}) {
	return db
		.insertInto('knowledge')
		.values({
			word_id: wordId,
			sentence_id: sentenceId,
			user_id: userId,
			knew: isKnown,
			studied_word_id: studiedWordId,
			type
		})
		.execute();
}

export async function transformAggregateKnowledge(
	{ wordId, userId }: { wordId: number; userId: number },

	transform: (opts: { alpha: number; beta: number | null; lastTime: number } | undefined) => {
		alpha: number;
		beta: number | null;
	}
) {
	return db.transaction().execute(async (transaction) => {
		const aggregateKnowledge = await transaction
			.selectFrom('aggregate_knowledge')
			.select(['alpha', 'beta', 'time'])
			.where('word_id', '=', wordId)
			.where('user_id', '=', userId)
			.executeTakeFirst();

		if (!aggregateKnowledge) {
			const values = transform(undefined);

			await transaction
				.insertInto('aggregate_knowledge')
				.values({
					word_id: wordId,
					user_id: userId,
					...values,
					time: new Date()
				})
				.execute();
		} else {
			const { alpha, beta, time: date } = aggregateKnowledge;

			const values = transform({
				alpha,
				beta,
				lastTime: dateToTime(date)
			});

			await transaction
				.updateTable('aggregate_knowledge')
				.set({ ...values, time: new Date() })
				.where('word_id', '=', wordId)
				.where('user_id', '=', userId)
				.execute();
		}
	});
}

export async function getEasiestUnstudiedWords() {
	return db
		.selectFrom('words')
		.leftJoin('aggregate_knowledge', 'word_id', 'id')
		.select(['id', 'word', 'level'])
		.where('aggregate_knowledge.word_id', 'is', null)
		.orderBy('level', 'asc')
		.limit(1)
		.execute();
}

export async function getAggregateKnowledgeForUser({
	userId
}: {
	userId: number;
}): Promise<AggKnowledgeForUser[]> {
	const raw = await db
		.selectFrom('aggregate_knowledge')
		.innerJoin('words', 'word_id', 'id')
		.select(['word_id', 'alpha', 'beta', 'time', 'level', 'word'])
		.where('user_id', '=', userId)
		.execute();

	return raw.map(({ word_id: wordId, level, alpha, beta, time, word }) => ({
		wordId,
		level,
		word,
		alpha,
		beta,
		lastTime: dateToTime(time)
	}));
}

export async function getRecentKnowledge({
	userId
}: {
	userId: number;
}): Promise<AggKnowledgeForUser[]> {
	const raw = await db
		.selectFrom('aggregate_knowledge')
		.innerJoin('words', 'word_id', 'id')
		.select(['word_id', 'alpha', 'beta', 'time', 'level', 'word'])
		.where('user_id', '=', userId)
		.where('alpha', '<', 0.95)
		.orderBy('time', 'desc')
		.limit(30)
		.execute();

	return raw.map(({ word_id: wordId, level, alpha, beta, time, word }) => ({
		wordId,
		level,
		word,
		alpha,
		beta,
		lastTime: dateToTime(time)
	}));
}

export async function getAggregateKnowledgeForUserWords({
	userId,
	wordIds
}: {
	userId: number;
	wordIds: number[];
}): Promise<AggKnowledgeForUser[]> {
	const raw = await db
		.selectFrom('aggregate_knowledge')
		.innerJoin('words', 'word_id', 'id')
		.select(['word_id', 'alpha', 'beta', 'time', 'level', 'word'])
		.where('user_id', '=', userId)
		.where('word_id', 'in', wordIds)
		.execute();

	return raw.map(({ word_id: wordId, level, alpha, beta, time, word }) => ({
		wordId,
		word,
		level,
		alpha,
		beta,
		lastTime: dateToTime(time)
	}));
}

export async function getRawKnowledgeForUser({
	userId,
	wordId
}: {
	userId: number;
	wordId: number;
}) {
	return db
		.selectFrom('knowledge')
		.select(['word_id', 'sentence_id', 'knew', 'time', 'type'])
		.where('user_id', '=', userId)
		.where('word_id', '=', wordId)
		.orderBy('time', 'asc')
		.execute();
}
