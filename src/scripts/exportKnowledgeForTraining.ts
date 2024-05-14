import { db } from '../db/client';
import { dateToTime } from '../logic/isomorphic/knowledge';
import { writeFileSync } from 'fs';

async function exportKnowledge() {
	let output = '';

	const rows = await db
		.selectFrom('knowledge')
		.innerJoin('words', 'knowledge.word_id', 'words.id')
		.selectAll()
		.where('time', '>', new Date('2024-05-02T16:35:00Z'))
		.orderBy('time', 'asc')
		.execute();

	let byWord = new Map<number, typeof rows>();

	let first = true;

	for (const row of rows) {
		let wordRows = byWord.get(row.word_id);

		if (!wordRows) {
			wordRows = [];
			byWord.set(row.word_id, wordRows);
		}

		const knewToValue = (knew: boolean | undefined) => (knew != undefined ? (knew ? 1 : 0) : -1);

		const knew = knewToValue(row.knew);
		const timesSeen = wordRows.length;

		const knewLastTime = knewToValue(wordRows[timesSeen - 1]?.knew);
		const knewSecondToLastTime = knewToValue(wordRows[timesSeen - 2]?.knew);
		const knewThirdToLastTime = knewToValue(wordRows[timesSeen - 3]?.knew);

		const MAX_TIME = 2;

		const timeToValue = (time: number) => Math.log(time + Math.E) / 5;

		const timeSinceLast =
			wordRows.length > 0
				? timeToValue(dateToTime(row.time) - dateToTime(wordRows[timesSeen - 1]!.time))
				: MAX_TIME;
		const timeBetweenFirstAndLast =
			timesSeen > 1
				? timeToValue(dateToTime(wordRows[timesSeen - 1]!.time) - dateToTime(wordRows[0].time))
				: 0;
		const timesKnown = wordRows.filter((r) => r.knew).length;
		const timesNotKnown = wordRows.filter((r) => !r.knew).length;
		const level = row.level / 100;
		const cognate = row.cognate ? 1 : 0;

		if (first) {
			output =
				'knew,knewLastTime,knewSecondToLastTime,knewThirdToLastTime,timesSeen,timeSinceLast,timeBetweenFirstAndLast,timesKnown,timesNotKnown,level,cognate\n';

			first = false;
		}

		output += `${knew},${knewLastTime},${knewSecondToLastTime},${knewThirdToLastTime},${timesSeen},${timeSinceLast},${timeBetweenFirstAndLast},${timesKnown},${timesNotKnown},${level},${cognate}\n`;

		wordRows.push(row);
	}

	writeFileSync('knowledge_training.csv', output);

	process.exit(0);
}

exportKnowledge();
