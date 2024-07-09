import { logError } from '$lib/logError';
import { z } from 'zod';
import { CorrectedPart, evaluateWrite as evaluateWriteAi } from '../ai/evaluateWrite';
import { Clause } from '../ai/splitIntoClauses';
import { getAggregateKnowledgeForUserWords } from '../db/knowledge';
import { getInflections, getLemmasOfWord } from '../db/lemmas';
import * as DB from '../db/types';
import { expectedKnowledge, now } from './isomorphic/knowledge';
import { toWordStrings } from './toWordStrings';
import { ExerciseKnowledge, Language } from './types';
import { exerciseToString } from '$lib/exerciseToString';

export type WriteEvaluationOpts = z.infer<typeof writeEvaluationOptsSchema>;

export interface WriteEvaluation {
	isCorrect: boolean;
	feedback: string;
	correctedSentence: string;
	userExercises: ExerciseKnowledge[];
	correctedParts: CorrectedPart[];
}

export const writeEvaluationOptsSchema = z
	.object({
		exercise: z.literal('write'),
		entered: z.string(),
		word: z.string()
	})
	.or(
		z.object({
			exercise: z.literal('translate'),
			entered: z.string(),
			english: z.string(),
			correct: z.string(),
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
	{ language }: { language: Language }
): Promise<WriteEvaluation> {
	let { correctedParts, correctedSentence, feedback } = await evaluateWriteAi(opts, language);

	return evaluateWriteFromAiOutput({ correctedParts, correctedSentence, feedback, opts, language });
}

export async function evaluateWriteFromAiOutput({
	opts,
	correctedParts,
	correctedSentence,
	feedback,
	language
}: {
	opts: z.infer<typeof writeEvaluationOptsSchema>;
	correctedParts: CorrectedPart[];
	correctedSentence: string;
	feedback: string;
	language: Language;
}): Promise<WriteEvaluation> {
	const isCorrect = correctedParts.length == 0;

	correctedParts = correctedParts
		.filter(({ severity }) => severity > 0)
		// validate that the clauses exist in the sentence
		.filter(({ correction }) => {
			const isIncluded = correctedSentence.toLowerCase().includes(correction.toLowerCase());

			if (!isIncluded) {
				console.warn(
					`Corrected clause "${correction}" not found in corrected sentence "${correctedSentence}".`
				);
			}

			const isChange = opts.entered.toLowerCase() != correction.toLowerCase();

			if (!isChange) {
				console.warn(`Corrected clause "${correction}" is the same as the original.`);
			}

			return isIncluded && isChange;
		});

	const originalCorrectedParts = correctedParts;

	const isSevere = ({ severity }: { severity: number }) => severity > 1;
	const isMinor = ({ severity }: { severity: number }) => severity == 1;

	// if there are more than two clauses, drop the minor ones
	if (correctedParts.length > 2 && correctedParts.some(isSevere) && correctedParts.some(isMinor)) {
		console.log(
			`Too many corrected parts. Dropping minor ${correctedParts
				.filter(isMinor)
				.map(({ correction }) => correction)
				.join(', ')} parts.`
		);

		correctedParts = correctedParts.filter(isSevere);
	}

	correctedParts = correctedParts.filter(({ correction, userWrote }) => {
		if (!userWrote) {
			console.log(`"${correction}" seems to be a missing word. Won't make an exercise.`);
		}

		return !!userWrote;
	});

	let userExercises: (ExerciseKnowledge & { severity: number; phrase?: string })[] =
		opts.exercise == 'translate'
			? await revealedClausesToUserExercises({
					revealedClauses: opts.revealedClauses.filter((clause) => {
						if (!correctedSentence.toLowerCase().includes(clause.sentence.toLowerCase())) {
							console.warn(
								`Corrected sentence "${correctedSentence}" does not include clause "${clause.sentence}". Dropping it.`
							);

							return false;
						}

						return true;
					}),
					sentence: opts.entered,
					language
				})
			: [];

	await Promise.all(
		correctedParts.map(async ({ correction, userWrote, english }) => {
			if (userWrote) {
				const wordStrings = toWordStrings(correction, language);

				if (wordStrings.length == 1) {
					const possibleWords = await getLemmasOfWord(wordStrings[0], language);

					if (possibleWords.length == 1) {
						const word = possibleWords[0];

						const wasInflectionOfCorrectWord = (await getInflections(word.id, language)).includes(
							userWrote.toLowerCase()
						);

						console.log(
							`User wrote "${userWrote}". This should be ${wasInflectionOfCorrectWord ? `a different form of ` : ''}the word ${word.word}.`
						);

						userExercises.push({
							id: null,
							sentenceId: -1,
							wordId: word.id,
							word: word.word,
							phrase: wordStrings[0],
							level: word.level,
							exercise: wasInflectionOfCorrectWord ? 'cloze-inflection' : 'cloze',
							isKnown: false,
							severity: 1
						});

						return;
					} else {
						console.log(
							`User wrote "${userWrote}". Cannot figure out the lemma (might be: ${
								possibleWords.map((w) => w.word).join(', ') || '[not a known word]'
							}); treating it as a phrase.`
						);
					}
				}
			}

			// if we couldn't find a word to study, study the whole clause
			if (english) {
				userExercises.push({
					id: null,
					sentenceId: -1,
					phrase: correction,
					exercise: 'phrase-cloze',
					hint: english,
					// ???
					level: 20,
					isKnown: false,
					severity: 2
				});
			} else {
				console.warn(
					`No English translation for clause "${correction}"; cannot generate exercise.`
				);
			}
		})
	);

	function getPhrase(exercise: ExerciseKnowledge & { phrase?: string }) {
		return (exercise.phrase || '-').toLowerCase();
	}

	// remove all userExercises where the phrase is contained in another exercise
	userExercises = userExercises.filter((exercise) => {
		const phrase = getPhrase(exercise);

		const dominatedBy = userExercises.find(
			(otherExercise) => otherExercise != exercise && getPhrase(otherExercise).includes(phrase)
		);

		if (dominatedBy) {
			console.log(
				`Removing exercise "${phrase}" because it is contained in "${getPhrase(dominatedBy)}".`
			);
		}

		return !dominatedBy;
	});

	if (userExercises.length > 2 && userExercises.some((e) => e.severity == 2)) {
		console.log(
			`Too many user exercises left. Dropping minor ${userExercises
				.filter(isMinor)
				.map(exerciseToString)
				.join(', ')} exercises.`
		);

		userExercises = userExercises.filter(isSevere);
	}

	if (userExercises.length > 2) {
		console.log(
			`Too many user exercises left. Arbitrarily dropping ${userExercises.slice(2).map(exerciseToString).join(', ')} exercises.`
		);

		userExercises = userExercises.slice(0, 2);
	}

	return {
		isCorrect,
		feedback,
		correctedSentence,
		userExercises,
		correctedParts: originalCorrectedParts
	};
}

function revealedClausesToUserExercises({
	revealedClauses,
	sentence,
	language
}: {
	revealedClauses: Clause[];
	sentence: string;
	language: Language;
}) {
	return Promise.all(
		revealedClauses
			.filter((c) => {
				if (!sentence.toLowerCase().includes(c.sentence.toLowerCase())) {
					logError(
						`Sentence "${sentence}" (${sentence}) does not include clause "${c.sentence}" with hint "${c.english}"`
					);

					return false;
				}

				return true;
			})
			.map(async (c): Promise<ExerciseKnowledge & { severity: number }> => {
				// if the phrase is a single word, prefer cloze
				const wordStrings = toWordStrings(c.sentence, language);

				if (wordStrings.length == 1) {
					const words = await getLemmasOfWord(wordStrings[0], language);

					if (words.length == 1) {
						const { level, id: wordId, word } = words[0];

						return {
							id: null,
							exercise: 'cloze',
							sentenceId: -1,
							level,
							word,
							wordId,
							isKnown: false,
							severity: 1
						};
					} else {
						console.warn(
							`Could not determine the lemma of the revealed clause "${c.sentence}": ${words.map((w) => w.word).join(', ') || '[not a known word]'}`
						);
					}
				}

				return {
					id: null,
					// TODO?!?
					level: 20,
					exercise: 'phrase-cloze',
					sentenceId: -1,
					phrase: c.sentence,
					hint: c.english,
					isKnown: false,
					severity: 2
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
