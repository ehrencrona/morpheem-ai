import { db } from '../db/client';
import { dateToTime } from '../logic/isomorphic/knowledge';
import { writeFileSync } from 'fs';

async function exportKnowledge() {
	let output = '';

	output =
		'knew,knewLastTime,knewSecondToLastTime,knewThirdToLastTime,timesSeen,didKnowFirstTime,didKnowLastTime,timeSinceLast,timeSinceFirst,timeBetweenFirstAndLast,didKnowSecondToLastTime,timeSinceSecondToLast,timesKnown,timesNotKnew,timeSinceLastKnew,timeSinceLastNotKnew,firstKnew,level,word,cognate,hasEverNotKnown,slidingAverageKnew\n';

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

		const knew = row.knew;
		const timesSeen = wordRows.length;

		const kn = 1.1;
		const nt = 0.2;
		const f = 0.3;
		let slidingAverageKnew = timesSeen > 0 ? (wordRows[0].knew ? kn : nt) : nt;

		for (let i = 1; i < timesSeen; i++) {
			slidingAverageKnew = (1 - f) * slidingAverageKnew + f * (wordRows[i].knew ? kn : nt);
		}

		slidingAverageKnew = Math.min(1, slidingAverageKnew);

		const lastKnew = wordRows.reverse().find((r) => r.knew);
		const lastNotKnew = wordRows.reverse().find((r) => !r.knew);

		const knewLastTime = timesSeen > 0 ? wordRows[timesSeen - 1]?.knew : '';
		const knewSecondToLastTime = timesSeen > 1 ? wordRows[timesSeen - 2]?.knew : '';
		const knewThirdToLastTime = timesSeen > 2 ? wordRows[timesSeen - 3]?.knew : '';

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

		output += `${knew},${knewLastTime},${knewSecondToLastTime},${knewThirdToLastTime},${timesSeen},${didKnowFirstTime},${didKnowLastTime},${timeSinceLast},${timeSinceFirst},${timeBetweenFirstAndLast},${didKnowSecondToLastTime},${timeSinceSecondToLast},${timesKnown},${timesNotKnew},${timeSinceLastKnew},${timeSinceLastNotKnew},${firstKnew},${level},${word},${cognate},${hasEverNotKnown},${slidingAverageKnew}\n`;

		wordRows.push(row);
	}

	writeFileSync('knowledge.csv', output);

	process.exit(0);
}

exportKnowledge();
