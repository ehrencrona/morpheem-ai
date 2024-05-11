import { db } from '../db/client';
import { dateToTime } from '../logic/isomorphic/knowledge';
import { writeFileSync } from 'fs';

async function exportKnowledge() {
	let output = '';

	output =
		'knew,timesSeen,didKnowFirstTime,didKnowLastTime,timeSinceLast,timeSinceFirst,timeBetweenFirstAndLast,didKnowSecondToLastTime,timeSinceSecondToLast,timesKnown,timesNotKnew,timeSinceLastKnew,timeSinceLastNotKnew,firstKnew,level,word,cognate,hasEverNotKnown\n';

	const rows = await db
		.selectFrom('knowledge')
		.innerJoin('words', 'knowledge.word_id', 'words.id')
		.selectAll()
		.where('time', '>', new Date('2024-05-02T16:35:00Z'))
		.orderBy('time', 'asc')
		.execute();

	let byWord = new Map<number, typeof rows>();

	for (const row of rows) {
		let wordRows = byWord.get(row.word_id);

		if (!wordRows) {
			wordRows = [];
			byWord.set(row.word_id, wordRows);
		}

		const lastKnew = wordRows.reverse().find((r) => r.knew);
		const lastNotKnew = wordRows.reverse().find((r) => !r.knew);

		const knew = row.knew;
		const timesSeen = wordRows.length;
		const didKnowFirstTime = timesSeen > 0 ? wordRows[0].knew : '';
		const didKnowLastTime = timesSeen > 0 ? wordRows[timesSeen - 1]?.knew : '';
		const timeSinceLast =
			wordRows.length > 0 ? dateToTime(row.time) - dateToTime(wordRows[timesSeen - 1]!.time) : '';
		const timeSinceFirst = timesSeen > 0 ? dateToTime(row.time) - dateToTime(wordRows[0].time) : '';
		const timeBetweenFirstAndLast =
			timesSeen > 1 ? dateToTime(wordRows[timesSeen - 1]!.time) - dateToTime(wordRows[0].time) : 0;
		const didKnowSecondToLastTime = timesSeen > 1 ? wordRows[timesSeen - 2]?.knew : '';
		const timeSinceSecondToLast =
			wordRows.length > 1 ? dateToTime(row.time) - dateToTime(wordRows[timesSeen - 2]!.time) : '';
		const timesKnown = wordRows.filter((r) => r.knew).length;
		const timesNotKnew = wordRows.filter((r) => !r.knew).length;
		const timeSinceLastKnew = lastKnew ? dateToTime(row.time) - dateToTime(lastKnew.time) : '';
		const timeSinceLastNotKnew = lastNotKnew
			? dateToTime(row.time) - dateToTime(lastNotKnew.time)
			: null;
		const firstKnew = timesSeen > 0 ? wordRows[0]?.knew : '';
		const level = row.level;
		const word = row.word;
		const cognate = row.cognate;
		const hasEverNotKnown = wordRows.some((r) => !r.knew);

		output += `${knew},${timesSeen},${didKnowFirstTime},${didKnowLastTime},${timeSinceLast},${timeSinceFirst},${timeBetweenFirstAndLast},${didKnowSecondToLastTime},${timeSinceSecondToLast},${timesKnown},${timesNotKnew},${timeSinceLastKnew},${timeSinceLastNotKnew},${firstKnew},${level},${word},${cognate},${hasEverNotKnown}\n`;

		wordRows.push(row);
	}

	writeFileSync('knowledge.csv', output);

	process.exit(0);
}

exportKnowledge();
