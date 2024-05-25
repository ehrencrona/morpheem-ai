import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getAggregateKnowledgeForUserWords, getRawKnowledgeForUser } from '../../../db/knowledge';
import { getForms } from '../../../db/lemmas';
import { getMnemonic } from '../../../db/mnemonics';
import { getSentencesWithWord } from '../../../db/sentences';
import { getAllWordTranslations } from '../../../db/wordTranslations';
import { getWordById, getWordByLemma } from '../../../db/words';
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
import { userId } from '../../../logic/user';
import { knowledgeTypeToExercise } from '../../../db/knowledgeTypes';

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
		? expectedKnowledge(knowledge[0], { now: now(), exercise: 'read' })
		: 0;

	const rawKnowledge = await getRawKnowledgeForUser({
		userId,
		wordId
	});

	let acc: AlphaBeta | null = null;

	const knowledgeHistory = rawKnowledge.map(({ type, knew: k, time: date }) => {
		const lastTime = dateToTime(date);
		const exercise = knowledgeTypeToExercise(type);
		const time = {
			now: now(),
			exercise
		};

		const knowledge = acc ? expectedKnowledge({ ...acc, lastTime }, time) : 0;

		if (acc == null) {
			acc = k ? knewFirst(exercise) : didNotKnowFirst(exercise);
		} else {
			acc = k ? knew({ ...acc, lastTime }, time) : didNotKnow({ ...acc, lastTime }, time);
		}

		return { ...acc, knew: k, time: lastTime, date, knowledge };
	}, null);

	const mnemonic = await getMnemonic({ wordId, userId });

	const translations = (await getAllWordTranslations(wordId)).map(({ english }) => english);

	return {
		sentences,
		word,
		forms,
		wordKnowledge,
		knowledgeHistory,
		mnemonic,
		translations
	};
}) satisfies ServerLoad;
