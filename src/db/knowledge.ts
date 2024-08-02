import { logError } from '$lib/logError';
import { dateToTime } from '../logic/isomorphic/knowledge';
import type { Language } from '../logic/types';
import { db } from './client';
import {
	isBetaExercise,
	KNOWLEDGE_TYPE_CLOZE,
	KNOWLEDGE_TYPE_CLOZE_INFLECTION,
	KNOWLEDGE_TYPE_READ,
	knowledgeTypeToExercise
} from './knowledgeTypes';
import { AggKnowledgeForUser, WordType } from './types';

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
	if (values.length == 0) {
		return;
	}

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

function toBatches<T>(arr: T[], size: number): T[][] {
	const batches = [];
	for (let i = 0; i < arr.length; i += size) {
		batches.push(arr.slice(i, i + size));
	}
	return batches;
}

/** Set the read or write knowledge in aggregate_knowledge for the test result, but only do it
 * if the user hasn't studied the word before (if they have, we have real data).
 * Note that you might be running the test for the second time.
 */
export async function storeTestResult(
	knowledge: {
		alpha: number;
		beta: number | null;
		wordId: number;
	}[],
	fieldToSet: 'beta' | 'alpha',
	userId: number,
	language: Language
) {
	knowledge = knowledge.filter(({ beta }) => beta !== null);

	if (!knowledge.length) {
		return;
	}

	const existingWordKnowledge = (
		await getRawKnowledgeForUser({
			userId,
			language
		})
	).reduce(
		(acc, { word_id, type }) => {
			if (!(fieldToSet == 'beta' && !isBetaExercise(knowledgeTypeToExercise(type)))) {
				acc[word_id] = true;
			}

			return acc;
		},
		{} as Record<number, boolean>
	);

	const time = new Date();

	return db.transaction().execute(async (transaction) => {
		for (const { wordId, alpha, beta } of knowledge) {
			if (!existingWordKnowledge[wordId]) {
				await transaction
					.withSchema(language.schema)
					.insertInto('aggregate_knowledge')
					.values([
						{
							user_id: userId,
							word_id: wordId,
							alpha,
							beta,
							time
						}
					])
					.onConflict((oc) =>
						oc
							.columns(['word_id', 'user_id'])
							.doUpdateSet(fieldToSet == 'alpha' ? { alpha, time } : { beta, time })
					)
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

			try {
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
			} catch (e) {
				logError(e, `Failed to insert aggregate knowledge for word ${wordId}, user ${userId}`);
			}
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
	limit,
	upToUnit
}: {
	language: Language;
	userId: number;
	limit: number;
	upToUnit?: number;
}) {
	const aggregateKnowledgeForUser = db
		.withSchema(language.schema)
		.selectFrom('aggregate_knowledge')
		.select(['word_id'])
		.where('user_id', '=', userId);

	let select = db
		.withSchema(language.schema)
		.selectFrom('words')
		.leftJoin(aggregateKnowledgeForUser.as('ak'), 'words.id', 'ak.word_id')
		.select(['words.id', 'words.word', 'words.level', 'words.type', 'words.unit'])
		.where('ak.word_id', 'is', null);

	if (upToUnit) {
		select = select.where('words.unit', '<=', upToUnit);
	}

	const result = await select.orderBy('words.level', 'asc').limit(limit).execute();

	return result;
}

export async function getAggregateKnowledgeForUser({
	userId,
	language,
	upToUnit
}: {
	userId: number;
	language: Language;
	upToUnit?: number;
}): Promise<AggKnowledgeForUser[]> {
	let select = db
		.withSchema(language.schema)
		.selectFrom('aggregate_knowledge')
		.innerJoin('words', 'word_id', 'id')
		.select(['word_id', 'alpha', 'beta', 'time', 'level', 'word', 'type'])
		.where('user_id', '=', userId);

	if (upToUnit) {
		select = select.where('unit', '<=', upToUnit);
	}

	const raw = await select.execute();

	return raw.map(({ word_id: wordId, level, alpha, beta, time, word, type }) => ({
		wordId,
		level,
		wordType: type ? (type as WordType) : undefined,
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
		.select(['word_id', 'alpha', 'beta', 'time', 'level', 'type', 'word'])
		.where('user_id', '=', userId)
		.where('alpha', '<', 0.95)
		.orderBy('time', 'desc')
		.limit(30)
		.execute();

	return raw.map(({ word_id: wordId, level, type, alpha, beta, time, word }) => ({
		wordId,
		level,
		wordType: type ? (type as WordType) : undefined,
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
		.select(['word_id', 'alpha', 'beta', 'time', 'level', 'type', 'word'])
		.where('user_id', '=', userId)
		.where('word_id', 'in', wordIds)
		.execute();

	return raw.map(({ word_id: wordId, level, type, alpha, beta, time, word }) => ({
		wordId,
		word,
		level,
		wordType: type ? (type as WordType) : undefined,
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
		.select(['word_id', 'sentence_id', 'knew', 'time', 'knowledge.type', 'level', 'word'])
		.where('knowledge.type', '=', type)
		.where('user_id', '=', userId);

	if (wordId !== undefined) {
		select = select.where('word_id', '=', wordId);
	}

	return select.orderBy('time', 'asc').execute();
}

export async function getRecentReadSentences({
	userId,
	language
}: {
	userId: number;
	language: Language;
}) {
	const rows = await db
		.withSchema(language.schema)
		.selectFrom('sentences as s')
		.innerJoin('knowledge as k', 'k.sentence_id', 's.id')
		.select(['s.id', 's.sentence', 'k.word_id'])
		.distinctOn(['k.time'])
		.where('k.user_id', '=', userId)
		.where('k.type', 'in', [
			KNOWLEDGE_TYPE_READ,
			KNOWLEDGE_TYPE_CLOZE,
			KNOWLEDGE_TYPE_CLOZE_INFLECTION
		])
		.orderBy('k.time', 'desc')
		.limit(20)
		.execute();

	return rows.filter(
		// eliminate duplicate sentence ids
		(row, i, arr) => arr.findIndex((r) => r.id === row.id) === i
	);
}
