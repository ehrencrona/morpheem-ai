import { db } from '../db/client';
import {
	dateToTime,
	didNotKnow,
	didNotKnowFirst,
	expectedKnowledge,
	knew,
	knewFirst,
	now
} from '../logic/isomorphic/knowledge';

interface AggregateKnowledge {
	time: Date;
	user_id: number;
	word_id: number;
	alpha: number;
	beta: number | null;
}

async function regenerateAggregateKnowledge() {
	const agg = new Map<number, AggregateKnowledge>();

	const rows = await db.selectFrom('knowledge').orderBy('time asc').selectAll().execute();

	for (const row of rows) {
		let aggWord = agg.get(row.word_id);

		if (!aggWord) {
			aggWord = {
				...row,
				...(row.knew ? knewFirst() : didNotKnowFirst())
			};
		} else {
			const now = dateToTime(row.time);
			const lastTime = dateToTime(aggWord.time);

			aggWord = {
				...aggWord,
				time: row.time,
				...(row.knew ? knew(aggWord, { now, lastTime }) : didNotKnow(aggWord, { now, lastTime }))
			};
		}

		agg.set(row.word_id, aggWord);
	}

	const previousAgg = await db
		.selectFrom('aggregate_knowledge')
		.innerJoin('words', 'word_id', 'words.id')
		.selectAll()
		.execute();

	const n = now();

	for (const row of previousAgg) {
		const aggWord = agg.get(row.word_id);

		if (aggWord) {
			console.log(
				`${row.word}: alpha ${aggWord.alpha}, beta ${aggWord.beta}, age ${
					n - dateToTime(aggWord.time)
				} -> ${Math.round(
					100 * expectedKnowledge(aggWord!, { now: n, lastTime: dateToTime(aggWord!.time) })
				)}%`
			);

			await db
				.updateTable('aggregate_knowledge')
				.set({
					alpha: aggWord?.alpha,
					beta: aggWord?.beta
				})
				.where('word_id', '=', row.word_id)
				.execute();
		} else {
			await db.deleteFrom('aggregate_knowledge').where('word_id', '=', row.word_id).execute();
		}
	}

	process.exit(0);
}

regenerateAggregateKnowledge();
