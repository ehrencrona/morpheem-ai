import { db } from '../db/client';

async function analyzeForgetting() {
	// get all knowledge sorted by time
	const all = await db
		.selectFrom('knowledge')
		.innerJoin('words', 'knowledge.word_id', 'words.id')
		.select(['words.word', 'level', 'word_id', 'knew', 'time'])
		.execute();

	const levels = new Map<
		number,
		{
			knew: number;
			didNotKnow: number;
		}
	>();

	for (let { level, knew, time } of all) {
		level = Math.round(level / 10);

		if (!levels.has(level)) {
			levels.set(level, { knew: 0, didNotKnow: 0 });
		}

		if (knew) {
			levels.get(level)!.knew++;
		} else {
			levels.get(level)!.didNotKnow++;
		}
	}

	for (let level = 0; level <= 10; level++) {
		const { knew, didNotKnow } = levels.get(level) || { knew: 0, didNotKnow: 0 };

		const total = knew + didNotKnow;
		const percent = (knew / total) * 100;

		console.log(`${level}\t${percent.toFixed(2)}% (${knew}/${total})`);
	}

	console.log('done');
}

analyzeForgetting();
