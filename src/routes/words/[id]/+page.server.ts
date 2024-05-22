import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getForms } from '../../../db/lemmas';
import { getSentencesWithWord } from '../../../db/sentences';
import { getWordById, getWordByLemma } from '../../../db/words';
import { getAggregateKnowledgeForUserWords, getRawKnowledgeForUser } from '../../../db/knowledge';
import { userId } from '../../../logic/user';
import {
	dateToTime,
	didNotKnow,
	didNotKnowFirst,
	expectedKnowledge,
	knew,
	knewFirst,
	now
} from '../../../logic/isomorphic/knowledge';
import { AlphaBeta } from '../../../logic/types';
import { getMnemonic } from '../../../db/mnemonics';

export const load = (async ({ params }) => {
	const wordId = parseInt(params.id!);

	if (isNaN(wordId)) {
		const word = await getWordByLemma(params.id!);

		return redirect(302, `/words/${word.id}`);
	}

	const word = await getWordById(wordId);

	const sentences = await getSentencesWithWord(wordId);

	const forms = await getForms(wordId);

	const knowledge = await getAggregateKnowledgeForUserWords({
		userId,
		wordIds: [wordId]
	});

	const wordKnowledge = knowledge.length
		? expectedKnowledge(knowledge[0], { now: now(), lastTime: knowledge[0].time })
		: 0;

	const rawKnowledge = await getRawKnowledgeForUser({
		userId,
		wordId
	});

	let acc: AlphaBeta | null = null;

	const knowledgeHistory = rawKnowledge.map(({ knew: k, time: date }) => {
		const time = {
			now: now(),
			lastTime: dateToTime(date)
		};

		const knowledge = acc ? expectedKnowledge(acc, time) : 0;

		if (acc == null) {
			acc = k ? knewFirst() : didNotKnowFirst();
		} else {
			acc = k ? knew(acc, time) : didNotKnow(acc, time);
		}

		return { ...acc, knew: k, time: dateToTime(date), date, knowledge };
	}, null);

	const mnemonic = await getMnemonic({ wordId, userId });

	return {
		sentences,
		word,
		forms,
		wordKnowledge,
		knowledgeHistory,
		mnemonic
	};
}) satisfies ServerLoad;
