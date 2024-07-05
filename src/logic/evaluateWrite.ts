import { logError } from '$lib/logError';
import { z } from 'zod';
import {
	evaluateWrite as evaluateWriteAi,
	generateTranslationFeedback as generateTranslationFeedbackAi
} from '../ai/evaluateWrite';
import { Clause } from '../ai/splitIntoClauses';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import { getSentence } from '../db/sentences';
import * as DB from '../db/types';
import { getMultipleWordsByLemmas, getWordByLemma, getWordsOfSentence } from '../db/words';
import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';
import { wordsToUnknownWords } from './findProvidedWordsInAnswer';
import { getWordInSentence } from './getWordInSentence';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { ExerciseKnowledge, Language, SentenceWord, WordKnowledge } from './types';

export type WriteEvaluationOpts = z.infer<typeof writeEvaluationOptsSchema>;

export interface WriteEvaluation {
	feedback: string;
	correctedSentence?: string | undefined;
	correctedPart?: string | undefined;
	unknownWords: UnknownWordResponse[];
	knowledge: (WordKnowledge & { word: DB.Word })[];
	userExercises: ExerciseKnowledge[];
}

export const writeEvaluationOptsSchema = z
	.object({
		exercise: z.literal('write'),
		exerciseId: z.number().nullish(),
		entered: z.string(),
		word: z.string()
	})
	.or(
		z.object({
			exercise: z.literal('translate'),
			exerciseId: z.number().nullish(),
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
	opts: z.infer<typeof writeEvaluationOptsSchema>,
	{ language, userId }: { language: Language; userId: number }
): Promise<WriteEvaluation> {
	const { entered: enteredSentence } = opts;

	const feedback =
		opts.exercise == 'translate'
			? await generateTranslationFeedbackAi(opts, language)
			: await evaluateWriteAi(opts, language);

	const correctedWordStrings = toWords(feedback.correctedPart || '', language, {
		doLowerCase: true
	});

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

	function getCorrectedWord({ shouldBe }: { shouldBe: string }) {
		const words = toWords(standardize(shouldBe), language, { doLowerCase: true });

		if (words.length == 1) {
			shouldBe = words[0];
		} else if (words.length > 1) {
			console.warn(`Should be "${shouldBe}" seems to be multiple words`);

			//shouldBe = longest word
			shouldBe = words.reduce((acc, word) => (word.length > acc.length ? word : acc));
		} else {
			console.warn(`Should be "${shouldBe}" seems to not be a word`);

			return undefined;
		}

		const i = correctedWordStrings.indexOf(shouldBe);

		if (i == -1) {
			console.warn(
				`Could not find the word "${shouldBe}" in the corrected sentence part "${feedback.correctedPart}".`
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

	let errors = feedback.errors || [];
	let knewOverallSentence = true;

	// this typically indicates there was an extraneous word in the translation
	errors = errors.filter((error) => error.shouldBe != '');

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
			if (word.type != 'name') {
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
			}
		} else {
			knewOverallSentence = false;
		}
	} else {
		knewOverallSentence = false;
	}

	userExercises.push({
		id: opts.exerciseId || null,
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
			...(await revealedClausesToUserExercises({
				revealedClauses: opts.revealedClauses,
				sentence,
				sentenceWords,
				language
			}))
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

function revealedClausesToUserExercises({
	revealedClauses,
	sentence,
	sentenceWords,
	language
}: {
	revealedClauses: Clause[];
	sentence: DB.Sentence;
	sentenceWords: SentenceWord[];
	language: Language;
}) {
	return Promise.all(
		revealedClauses
			.filter((c) => {
				if (!sentence.sentence.toLowerCase().includes(c.sentence.toLowerCase())) {
					logError(
						`Sentence "${sentence.sentence}" (${sentence.id}) does not include clause "${c.sentence}" with hint "${c.english}"`
					);

					return false;
				}

				return true;
			})
			.map(async (c): Promise<ExerciseKnowledge> => {
				// if the phrase is a single word, prefer cloze
				if (toWords(c.sentence, language).length == 1) {
					try {
						const {
							level,
							id: wordId,
							word
						} = await getWordInSentence(c.sentence, sentence.id, sentenceWords, language);

						return {
							id: null,
							exercise: 'cloze',
							sentenceId: sentence.id,
							level,
							word,
							wordId,
							isKnown: false
						};
					} catch (e: any) {
						e.message = `While trying to find word for clause "${c.sentence}" in sentence "${sentence.sentence}" (${sentence.id}): ${e.message}`;
						logError(e);
					}
				}

				return {
					id: null,
					// TODO?!?
					level: 20,
					exercise: 'phrase-cloze',
					sentenceId: sentence.id,
					phrase: c.sentence,
					hint: c.english,
					isKnown: false
				};
			})
	);
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
