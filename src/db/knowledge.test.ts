import { expect, test } from 'vitest';
import { db } from './client';
import { getWords } from './words';
import { POLISH } from '../constants';
import { KNOWLEDGE_TYPE_READ, KNOWLEDGE_TYPE_WRITE } from './knowledgeTypes';
import { storeTestResult } from './knowledge';

test('storeTestResult', async () => {
	const user = await db
		.insertInto('auth_user')
		.values({
			id: randomString(),
			username: randomString(),
			password_hash: randomString()
		} as any)
		.returning('num')
		.executeTakeFirst();

	if (!user) {
		throw new Error('User not created');
	}

	const wordIds = (await getWords({ language: POLISH })).map(({ id }) => id).slice(0, 100);

	const readWordId = wordIds[0];
	const writtenWordId = wordIds[1];
	const unstudiedWordId = wordIds[2];
	// previously tested but unstudied
	const testedWordId = wordIds[3];

	const time = new Date();

	await db
		.withSchema('pl')
		.insertInto('knowledge')
		.values([
			{
				user_id: user.num,
				word_id: writtenWordId,
				knew: false,
				time,
				type: KNOWLEDGE_TYPE_WRITE
			},
			{
				user_id: user.num,
				word_id: readWordId,
				knew: false,
				time,
				type: KNOWLEDGE_TYPE_READ
			}
		])
		.execute();

	await db
		.withSchema('pl')
		.insertInto('aggregate_knowledge')
		.values([
			{
				user_id: user.num,
				word_id: readWordId,
				alpha: 0.34,
				beta: null,
				time
			},
			{
				user_id: user.num,
				word_id: writtenWordId,
				alpha: 0.12,
				beta: 0.23,
				time
			},
			{ user_id: user.num, word_id: testedWordId, alpha: 0.45, beta: 0.56, time }
		])
		.execute();

	async function getAggregateKnowledge() {
		const agg = await db
			.withSchema('pl')
			.selectFrom('aggregate_knowledge')
			.selectAll()
			.where('user_id', '=', user!.num)
			.where('word_id', 'in', [readWordId, writtenWordId, unstudiedWordId, testedWordId])
			.execute();

		function find(wordId: number) {
			return agg.find(({ word_id }) => word_id == wordId)!;
		}

		return [find(readWordId), find(writtenWordId), find(unstudiedWordId), find(testedWordId)];
	}

	await storeTestResult(
		[
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: readWordId
			},
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: writtenWordId
			},
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: unstudiedWordId
			},
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: testedWordId
			}
		],
		'alpha',
		user.num,
		POLISH
	);

	expect(await getAggregateKnowledge()).toMatchObject([
		{
			alpha: 0.34,
			beta: null
		},
		{
			alpha: 0.12,
			beta: 0.23
		},
		// this was inserted
		{
			alpha: 0.2,
			beta: 0.3
		},
		// alpha was updated
		{
			alpha: 0.2,
			beta: 0.56
		}
	]);

	await storeTestResult(
		[
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: readWordId
			},
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: writtenWordId
			},
			{
				alpha: 0.2,
				// note: different beta
				beta: 0.4,
				wordId: unstudiedWordId
			},
			{
				alpha: 0.2,
				beta: 0.3,
				wordId: testedWordId
			}
		],
		'beta',
		user.num,
		POLISH
	);

	expect(await getAggregateKnowledge()).toMatchObject([
		{
			alpha: 0.34,
			beta: 0.3
		},
		{
			alpha: 0.12,
			beta: 0.23
		},
		{
			alpha: 0.2,
			beta: 0.4
		},
		{
			alpha: 0.2,
			beta: 0.3
		}
	]);

	await db.deleteFrom('auth_user').where('num', '=', user.num).execute();
});

function randomString() {
	return Math.random().toString(36).substring(7);
}
