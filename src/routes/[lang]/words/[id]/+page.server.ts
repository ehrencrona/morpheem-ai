import { error, redirect, type ServerLoad } from '@sveltejs/kit';
import {
	getAggregateKnowledgeForUserWords,
	getRawKnowledgeForUser
} from '../../../../db/knowledge';
import { knowledgeTypeToExercise } from '../../../../db/knowledgeTypes';
import { getForms } from '../../../../db/lemmas';
import { getMnemonic } from '../../../../db/mnemonics';
import { getSentencesWithWord } from '../../../../db/sentences';
import * as DB from '../../../../db/types';
import { getAllWordTranslations } from '../../../../db/wordTranslations';
import { getWordById, getWordByLemma } from '../../../../db/words';
import {
	calculateRepetitionValue,
	dateToTime,
	didNotKnow,
	didNotKnowFirst,
	expectedKnowledge,
	knew,
	knewFirst,
	now
} from '../../../../logic/isomorphic/knowledge';
import { AlphaBeta } from '../../../../logic/types';

export const load: ServerLoad = async ({ params, locals: { language, userId, isAdmin } }) => {
	const wordId = parseInt(params.id!);

	if (isNaN(wordId)) {
		let word: DB.Word;

		try {
			word = await getWordByLemma(params.id!, language);
		} catch (e) {
			console.log(e);
			return error(404, 'Word not found');
		}

		redirect(302, `/${language.code}/words/${word.id}`);
	}

	const word = await getWordById(wordId, language);

	const sentences = await getSentencesWithWord(wordId, {
		userId: userId || undefined,
		language,
		limit: 30
	});

	const forms = await getForms(wordId, language);

	const knowledge = userId
		? await getAggregateKnowledgeForUserWords({
				userId,
				wordIds: [wordId],
				language
			})
		: [];

	const readKnowledge = knowledge.length
		? expectedKnowledge(knowledge[0], { now: now(), exercise: 'read' })
		: 0;
	const writeKnowledge = knowledge.length
		? expectedKnowledge(knowledge[0], { now: now(), exercise: 'write' })
		: 0;

	const rawKnowledge = await getRawKnowledgeForUser({
		userId: userId!,
		wordId,
		language
	});

	let acc: AlphaBeta | null = null;

	const knowledgeHistory = rawKnowledge
		.map(({ type, knew: k, time: date }) => {
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
		}, null)
		.slice(-10)
		.reverse();

	const k = knowledge[0];

	const repetitionValueRead = k
		? calculateRepetitionValue(k, {
				now: now(),
				exercise: 'read'
			})
		: 0;
	const repetitionValueWrite = k
		? calculateRepetitionValue(k, {
				now: now(),
				exercise: 'write'
			})
		: 0;

	const mnemonic = await getMnemonic({ wordId, userId: userId!, language });

	const translations = (
		await getAllWordTranslations({ wordId, language, inflected: undefined })
	).map(({ english }) => english);

	return {
		sentences,
		word,
		forms,
		readKnowledge,
		writeKnowledge,
		repetitionValueRead,
		repetitionValueWrite,
		knowledgeHistory,
		knowledgeLength: rawKnowledge.length,
		mnemonic,
		translations,
		languageCode: language.code,
		isAdmin
	};
};
