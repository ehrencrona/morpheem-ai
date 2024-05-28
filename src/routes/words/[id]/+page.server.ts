import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getAggregateKnowledgeForUserWords, getRawKnowledgeForUser } from '../../../db/knowledge';
import { knowledgeTypeToExercise } from '../../../db/knowledgeTypes';
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

export const load: ServerLoad = (async ({ params, locals }) => {
	const { language } = locals;
	const wordId = parseInt(params.id!);

	if (isNaN(wordId)) {
		const word = await getWordByLemma(params.id!, language);

		return redirect(302, `/words/${word.id}`);
	}

	const userId = locals.user!.num;

	const word = await getWordById(wordId, language);

	const sentences = await getSentencesWithWord(wordId, language);

	const forms = await getForms(wordId, language);

	const knowledge = await getAggregateKnowledgeForUserWords({
		userId,
		wordIds: [wordId],
		language
	});

	const readKnowledge = knowledge.length
		? expectedKnowledge(knowledge[0], { now: now(), exercise: 'read' })
		: 0;
	const writeKnowledge = knowledge.length
		? expectedKnowledge(knowledge[0], { now: now(), exercise: 'write' })
		: 0;

	const rawKnowledge = await getRawKnowledgeForUser({
		userId,
		wordId,
		language
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

		return { ...acc, knew: k, time: lastTime, date, knowledge, exercise };
	}, null);

	const mnemonic = await getMnemonic({ wordId, userId, language });

	const translations = (await getAllWordTranslations(wordId, language)).map(
		({ english }) => english
	);

	return {
		sentences,
		word,
		forms,
		readKnowledge,
		writeKnowledge,
		knowledgeHistory,
		mnemonic,
		translations
	};
}) satisfies ServerLoad;
