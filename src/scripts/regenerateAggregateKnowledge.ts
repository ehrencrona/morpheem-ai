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
	now
} from '../logic/isomorphic/knowledge';

async function regenerateAggregateKnowledge() {
	const agg = new Map<number, Omit<AggKnowledgeForUser, 'word' | 'level'>>();

	const userId = 4711;

	const rows = (
		await db
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
				...(row.knew ? knewFirst(exercise) : didNotKnowFirst(exercise))
			};
		} else {
			const now = dateToTime(row.time);

			aggWord = {
				...aggWord,
				lastTime: row.lastTime,
				...(row.knew ? knew(aggWord, { now, exercise }) : didNotKnow(aggWord, { now, exercise }))
			};
		}

		if (exercise != 'read') {
			console.log(
				`${row.word_id}: alpha ${aggWord.alpha}, beta ${aggWord.beta}, age ${
					now() - aggWord.lastTime
				} -> ${Math.round(100 * expectedKnowledge(aggWord, { now: now(), exercise }))}%`
			);
		}

		agg.set(row.word_id, aggWord);
	}

	const previousAgg = await db
		.selectFrom('aggregate_knowledge')
		.where('user_id', '=', userId)
		.innerJoin('words', 'word_id', 'words.id')
		.selectAll()
		.execute();

	const n = now();

	for (const row of previousAgg) {
		const aggWord = agg.get(row.word_id);

		if (aggWord) {
			// console.log(
			// 	`${row.word}: alpha ${aggWord.alpha}, beta ${aggWord.beta}, age ${
			// 		n - aggWord.lastTime
			// 	} -> ${Math.round(100 * expectedKnowledge(aggWord!, { now: n, exercise: 'read' }))}%`
			// );

			await db
				.updateTable('aggregate_knowledge')
				.set({
					alpha: aggWord?.alpha,
					beta: aggWord?.beta
				})
				.where('word_id', '=', row.word_id)
				.where('user_id', '=', userId)
				.execute();
		} else {
			await db
				.deleteFrom('aggregate_knowledge')
				.where('word_id', '=', row.word_id)
				.where('user_id', '=', userId)
				.execute();
		}
	}

	process.exit(0);
}

regenerateAggregateKnowledge();
