import { z } from 'zod';
import {
	generateTranslationFeedback as generateTranslationFeedbackAi,
	evaluateWrite as evaluateWriteAi
} from '../ai/evaluateWrite';
import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import * as DB from '../db/types';
import { getMultipleWordsByLemmas, getWordByLemma, getWordsOfSentence } from '../db/words';
import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';
import { wordsToUnknownWords } from './findProvidedWordsInAnswer';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { ExerciseKnowledge, Language, WordKnowledge } from './types';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { getSentence } from '../db/sentences';
import { logError } from '$lib/logError';
import { getSentenceWords } from './addSentence';

export type WritingFeedbackOpts = z.infer<typeof writingFeedbackOptsSchema>;

export interface WritingFeedbackResponse {
	feedback: string;
	correctedSentence?: string | undefined;
	correctedPart?: string | undefined;
	unknownWords: UnknownWordResponse[];
	knowledge: (WordKnowledge & { word: DB.Word })[];
	userExercises: ExerciseKnowledge[];
}

export const writingFeedbackOptsSchema = z
	.object({
		exercise: z.literal('write'),
		exerciseId: z.number().nullable(),
		entered: z.string(),
		word: z.string()
	})
	.or(
		z.object({
			exercise: z.literal('translate'),
			exerciseId: z.number().nullable(),
			entered: z.string(),
			correct: z.string(),
			english: z.string(),
			sentenceId: z.number(),
			revealedClauses: z.array(
				z.object({
					sentence: z.string(),
					english: z.string()
				})
			)
		})
	);

export async function evaluateWrite(
	opts: z.infer<typeof writingFeedbackOptsSchema>,
	{ language, userId }: { language: Language; userId: number }
): Promise<WritingFeedbackResponse> {
	const { entered: enteredSentence } = opts;

	const feedback =
		opts.exercise == 'translate'
			? await generateTranslationFeedbackAi(opts, language)
			: await evaluateWriteAi(opts, language);

	const correctedWordStrings = toWords(feedback.correctedPart || '', language);

	const [enteredLemmas, correctedLemmas] = await lemmatizeSentences(
		[enteredSentence, feedback.correctedPart || ''],
		{ language, ignoreErrors: true }
	);

	const newLemmas = correctedLemmas.filter((word) => !enteredLemmas.includes(word));

	let [enteredWords, newWords] = await Promise.all([
		getMultipleWordsByLemmas(enteredLemmas, language),
		getMultipleWordsByLemmas(newLemmas, language)
	]);

	// TODO: maybe run this on the corrected sentence?
	// await getSentenceWords(enteredSentence, enteredLemmas, language);

	console.log(
		`User wrote "${enteredSentence}". Corrected to "${'correctedSentence' in feedback ? feedback.correctedSentence : '-'}".\n` +
			`User was provided with the words ${newWords.map(({ word }) => word).join(', ')} in the correction "${feedback.correctedPart}".`
	);

	newWords = await filterClearlyKnownWords(newWords, userId!, language);

	const [sentence, sentenceWords] =
		opts.exercise == 'translate'
			? await Promise.all([
					getSentence(opts.sentenceId, language),
					getWordsOfSentence(opts.sentenceId, language)
				])
			: [undefined, undefined];

	let userExercises: ExerciseKnowledge[] = [];

	function getCorrectedWord(error: { shouldBe: string }) {
		const i = correctedWordStrings.indexOf(error.shouldBe);

		if (i == -1) {
			console.warn(
				`Could not find the word "${error.shouldBe}" in the corrected sentence part "${feedback.correctedPart}".`
			);

			return undefined;
		}

		const lemma = correctedLemmas[i];

		if (sentenceWords) {
			const word = sentenceWords.find((word) => word.word == lemma);

			if (word) {
				return word;
			} else {
				console.warn(
					`Could not find the corrected word "${lemma}" in the sentence "${sentence.sentence}".`
				);

				return undefined;
			}
		}

		return getWordByLemma(lemma, language);
	}

	const errors = feedback.errors || [];
	let knewOverallSentence = true;

	if (errors.length == 0) {
		// no exercise.
	} else if (!errors.some((error) => error.error != 'inflection') && errors.length < 3) {
		for (const error of errors || []) {
			const word = await getCorrectedWord(error);

			if (word) {
				userExercises.push({
					id: null,
					sentenceId: -1,
					wordId: word.id,
					word: word.word,
					// just set a fixed value?
					level: word.level,
					exercise: 'cloze-inflection',
					isKnown: false
				});
			} else {
				knewOverallSentence = false;
			}
		}
	} else if (errors.length == 1) {
		const word = await getCorrectedWord(errors[0]);

		if (word) {
			userExercises.push({
				id: null,
				sentenceId: -1,
				wordId: word.id,
				word: word.word,
				// just set a fixed value?
				level: word.level,
				exercise: 'cloze',
				isKnown: false
			});
		} else {
			knewOverallSentence = false;
		}
	} else {
		knewOverallSentence = false;
	}

	userExercises.push({
		id: opts.exerciseId,
		sentenceId: -1,
		// ?
		level: enteredWords.concat(newWords).reduce((acc, word) => Math.max(acc, word.level), 0),
		exercise: 'translate',
		isKnown: knewOverallSentence
	});

	if (
		opts.exercise == 'translate' &&
		!!sentence &&
		// if we have to translate the whole sentence again, no point in giving a phrase cloze exercise
		!userExercises.find((e) => e.exercise == 'translate' && !e.isKnown)
	) {
		userExercises = [
			...userExercises,
			...opts.revealedClauses
				.filter((c) => {
					if (!sentence.sentence.toLowerCase().includes(c.sentence.toLowerCase())) {
						logError(
							`Sentence "${sentence.sentence}" (${sentence.id}) does not include clause "${c.sentence}" with hint "${c.english}"`
						);

						return false;
					}

					return true;
				})
				.map(
					(c) =>
						({
							id: null,
							// TODO?!?
							level: 20,
							exercise: 'phrase-cloze',
							sentenceId: sentence.id,
							phrase: c.sentence,
							hint: c.english,
							isKnown: false
						}) satisfies ExerciseKnowledge
				)
		];
	}

	const unknownWords = await wordsToUnknownWords(newWords, userId!, language);

	return {
		...feedback,
		unknownWords,
		knowledge: (enteredWords as DB.Word[]).concat(newWords).map((word) => ({
			word,
			wordId: word.id,
			isKnown: !newWords.includes(word),
			sentenceId: undefined,
			type: KNOWLEDGE_TYPE_WRITE,
			userId
		})),
		userExercises
	};
}

export async function filterClearlyKnownWords<W extends DB.Word>(
	unknownWords: W[],
	userId: number,
	language: Language
): Promise<W[]> {
	const knowledge = await getAggregateKnowledgeForUserWords({
		userId,
		wordIds: unknownWords.map(({ id }) => id),
		language
	});

	return unknownWords.filter((word) => {
		const k = knowledge.find(({ wordId }) => wordId === word.id);
		const knew = k && expectedKnowledge(k, { now: now(), exercise: 'write' }) > 0.9;

		if (knew) {
			console.log(`User already knew the word ${word.word}.`);
		}

		return !knew;
	});
}
