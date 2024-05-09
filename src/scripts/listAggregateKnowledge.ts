import { db } from '../db/client';
import { dateToTime, expectedKnowledge, now } from '../logic/isomorphic/knowledge';

async function listAggregateKnowledge() {
	const all = await db
		.selectFrom('aggregate_knowledge')
		.innerJoin('words', 'aggregate_knowledge.word_id', 'words.id')
		.select(['words.word', 'word_id', 'alpha', 'beta', 'time'])
		.execute();

	const n = now();

	console.log(
		all
			.map(({ word, alpha, beta, time }) => {
				const knowledge = Math.round(
					expectedKnowledge(
						{
							alpha,
							beta
						},
						{
							lastTime: dateToTime(time),
							now: n
						}
					) * 100
				);

				return `${knowledge}% ${word} (${alpha}, ${beta}) ${formatMinutes(n - dateToTime(time))} ago)`;
			})
			.join('\n')
	);
}

function formatMinutes(minutes: number) {
	if (minutes < 60) {
		return `${Math.round(minutes)} minutes`;
	}

	const hours = minutes / 60;

	if (hours < 24) {
		return `${Math.round(hours)} hours`;
	}

	const days = hours / 24;

	if (days < 7) {
		return `${Math.round(days)} days`;
	}

	const weeks = days / 7;

	if (weeks < 4) {
		return `${Math.round(weeks)} weeks`;
	}

	const months = days / 30;

	if (months < 12) {
		return `${Math.round(months)} months`;
	}

	const years = months / 12;

	return `${Math.round(years)} years`;
}

listAggregateKnowledge();
