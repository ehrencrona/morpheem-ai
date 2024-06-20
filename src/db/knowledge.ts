import { dateToTime } from '../logic/isomorphic/knowledge';
import type { Language } from '../logic/types';
import { db } from './client';
import { AggKnowledgeForUser } from './types';

export function addKnowledge(
	values: {
		wordId: number;
		sentenceId?: number;
		userId: number;
		isKnown: boolean;
		studiedWordId?: number;
		type: number;
	}[],
	language: Language
) {
	return db
		.withSchema(language.schema)
		.insertInto('knowledge')
		.values(
			values.map(({ wordId, sentenceId, userId, isKnown, studiedWordId, type }) => ({
				word_id: wordId,
				sentence_id: sentenceId,
				user_id: userId,
				knew: isKnown,
				studied_word_id: studiedWordId,
				type
			}))
		)
		.execute();
}

export function addAggregateKnowledgeUnlessExists(
	knowledge: {
		alpha: number;
		beta: number | null;
		wordId: number;
	}[],
	userId: number,
	language: Language
) {
	return db.transaction().execute(async (transaction) => {
		for (const { alpha, beta, wordId } of knowledge) {
			await transaction
				.withSchema(language.schema)
				.insertInto('aggregate_knowledge')
				.values({
					word_id: wordId,
					user_id: userId,
					alpha,
					beta,
					time: new Date()
				})
				.onConflict((oc) => oc.columns(['word_id', 'user_id']).doNothing())
				.execute();
		}
	});
}

export async function setBetaIfNull(
	knowledge: {
		beta: number | null;
		wordId: number;
	}[],
	userId: number,
	language: Language
) {
	knowledge = knowledge.filter(({ beta }) => beta !== null);

	return db.transaction().execute(async (transaction) => {
		const wordIdToSet = await transaction
			.withSchema(language.schema)
			.selectFrom('aggregate_knowledge')
			.select(['word_id'])
			.where('beta', 'is', null)
			.where('user_id', '=', userId)
			.where(
				'word_id',
				'in',
				knowledge.map(({ wordId }) => wordId)
			)
			.execute();

		for (const { wordId, beta } of knowledge) {
			if (wordIdToSet.some(({ word_id }) => word_id === wordId)) {
				await transaction
					.withSchema(language.schema)
					.updateTable('aggregate_knowledge')
					.set({
						beta,
						time: new Date()
					})
					.where('word_id', '=', wordId)
					.where('user_id', '=', userId)
					.execute();
			}
		}
	});
}

export async function transformAggregateKnowledge(
	{ wordId, userId }: { wordId: number; userId: number },

	transform: (opts: { alpha: number; beta: number | null; lastTime: number } | undefined) => {
		alpha: number;
		beta: number | null;
	},
	language: Language
) {
	return db.transaction().execute(async (transaction) => {
		const aggregateKnowledge = await transaction
			.withSchema(language.schema)
			.selectFrom('aggregate_knowledge')
			.select(['alpha', 'beta', 'time'])
			.where('word_id', '=', wordId)
			.where('user_id', '=', userId)
			.executeTakeFirst();

		if (!aggregateKnowledge) {
			const values = transform(undefined);

			await transaction
				.withSchema(language.schema)
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
				.withSchema(language.schema)
				.updateTable('aggregate_knowledge')
				.set({ ...values, time: new Date() })
				.where('word_id', '=', wordId)
				.where('user_id', '=', userId)
				.execute();
		}
	});
}

export async function getEasiestUnstudiedWords({
	language,
	userId,
	limit
}: {
	language: Language;
	userId: number;
	limit: number;
}) {
	const aggregateKnowledgeForUser = db
		.withSchema(language.schema)
		.selectFrom('aggregate_knowledge')
		.select(['word_id'])
		.where('user_id', '=', userId);

	return db
		.withSchema(language.schema)
		.selectFrom('words')
		.leftJoin(aggregateKnowledgeForUser.as('ak'), 'words.id', 'ak.word_id')
		.select(['words.id', 'words.word', 'words.level'])
		.where('ak.word_id', 'is', null)
		.orderBy('words.level', 'asc')
		.limit(limit)
		.execute();
}

export async function getAggregateKnowledgeForUser({
	userId,
	language
}: {
	userId: number;
	language: Language;
}): Promise<AggKnowledgeForUser[]> {
	const raw = await db
		.withSchema(language.schema)
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
		lastTime: dateToTime(time),
		source: 'studied'
	}));
}

export async function getRecentKnowledge({
	userId,
	language
}: {
	userId: number;
	language: Language;
}): Promise<AggKnowledgeForUser[]> {
	const raw = await db
		.withSchema(language.schema)
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
		lastTime: dateToTime(time),
		source: 'studied'
	}));
}

export async function getAggregateKnowledgeForUserWords({
	wordIds,
	userId,
	language
}: {
	wordIds: number[];
	userId: number;
	language: Language;
}): Promise<AggKnowledgeForUser[]> {
	if (wordIds.length === 0) {
		return [];
	}

	const raw = await db
		.withSchema(language.schema)
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
		lastTime: dateToTime(time),
		source: 'studied'
	}));
}

export async function getRawKnowledgeForUser({
	userId,
	wordId,
	language
}: {
	userId: number;
	wordId?: number;
	language: Language;
}) {
	let select = db
		.withSchema(language.schema)
		.selectFrom('knowledge')
		.select(['word_id', 'sentence_id', 'knew', 'time', 'type'])
		.where('user_id', '=', userId);

	if (wordId !== undefined) {
		select = select.where('word_id', '=', wordId);
	}

	return select.orderBy('time', 'asc').execute();
}

export async function getRawKnowledgeJoinedWithWordsForUser({
	userId,
	wordId,
	language,
	type
}: {
	userId: number;
	wordId?: number;
	language: Language;
	type: number;
}) {
	let select = db
		.withSchema(language.schema)
		.selectFrom('knowledge')
		.innerJoin('words', 'word_id', 'id')
		.select(['word_id', 'sentence_id', 'knew', 'time', 'type', 'level', 'word', 'type'])
		.where('type', '=', type)
		.where('user_id', '=', userId);

	if (wordId !== undefined) {
		select = select.where('word_id', '=', wordId);
	}

	return select.orderBy('time', 'asc').execute();
}
