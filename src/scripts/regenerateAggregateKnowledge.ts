import { db } from '../db/client';
import { knowledgeTypeToExercise } from '../db/knowledgeTypes';
import { AggKnowledgeForUser } from '../db/types';
import {
	dateToTime,
	didNotKnow,
	didNotKnowFirst,
	expectedKnowledge,
	knew,
	knewFirst,
	now,
	timeToDate
} from '../logic/isomorphic/knowledge';

async function regenerateAggregateKnowledge() {
	const agg = new Map<number, Omit<AggKnowledgeForUser, 'word' | 'level' | 'type' | 'wordType'>>();

	const userId = 4711;

	const rows = (
		await db
			.withSchema('pl')
			.selectFrom('knowledge')
			.orderBy('time asc')
			.where('user_id', '=', userId)
			.selectAll()
			.execute()
	).map((row) => ({
		...row,
		wordId: row.word_id,
		lastTime: dateToTime(row.time),
		exercise: knowledgeTypeToExercise(row.type)
	}));

	for (const row of rows) {
		let aggWord = agg.get(row.word_id);
		const { exercise } = row;

		if (!aggWord) {
			aggWord = {
				...row,
				...(row.knew ? knewFirst(exercise) : didNotKnowFirst(exercise)),
				source: 'studied'
			};
		} else {
			const now = dateToTime(row.time);

			aggWord = {
				...aggWord,
				lastTime: row.lastTime,
				...(row.knew ? knew(aggWord, { now, exercise }) : didNotKnow(aggWord, { now, exercise }))
			};
		}

		// if (exercise != 'read') {
		// 	console.log(
		// 		`${row.word_id}: alpha ${aggWord.alpha}, beta ${aggWord.beta}, age ${
		// 			now() - aggWord.lastTime
		// 		} -> ${Math.round(100 * expectedKnowledge(aggWord, { now: now(), exercise }))}%`
		// 	);
		// }

		agg.set(row.word_id, aggWord);
	}

	const previousAgg = await db
		.withSchema('pl')
		.selectFrom('aggregate_knowledge')
		.where('user_id', '=', userId)
		.innerJoin('words', 'word_id', 'words.id')
		.selectAll()
		.execute();

	const n = now();

	let at = 0;

	for (const row of previousAgg) {
		const aggWord = agg.get(row.word_id);

		if (at++ % 250 == 0) {
			console.log('Updating', at, '/', previousAgg.length);
		}

		if (aggWord) {
			// console.log(
			// 	`${row.word}: alpha ${aggWord.alpha}, beta ${aggWord.beta}, age ${
			// 		n - aggWord.lastTime
			// 	} -> ${Math.round(100 * expectedKnowledge(aggWord!, { now: n, exercise: 'read' }))}%`
			// );

			await db
				.withSchema('pl')
				.updateTable('aggregate_knowledge')
				.set({
					alpha: aggWord?.alpha,
					beta: aggWord?.beta,
					time: timeToDate(aggWord.lastTime)
				})
				.where('word_id', '=', row.word_id)
				.where('user_id', '=', userId)
				.execute();
		} else {
			await db
				.withSchema('pl')
				.deleteFrom('aggregate_knowledge')
				.where('word_id', '=', row.word_id)
				.where('user_id', '=', userId)
				.execute();
		}
	}

	at = 0;

	const newRows = [...agg.values()].filter(
		(r) => !previousAgg.find(({ word_id }) => word_id == r.wordId)
	);

	for (const row of newRows) {
		if (at++ % 250 == 0) {
			console.log('Adding', at, '/', newRows.length);
		}

		await db
			.withSchema('pl')
			.insertInto('aggregate_knowledge')
			.values({
				user_id: userId,
				word_id: row.wordId,
				alpha: row.alpha,
				beta: row.beta,
				time: timeToDate(row.lastTime)
			})
			.execute();
	}

	process.exit(0);
}

regenerateAggregateKnowledge();
