import { z } from 'zod';
import {
	generateTranslationFeedback as generateTranslationFeedbackAi,
	evaluateWrite as evaluateWriteAi
} from '../ai/evaluateWrite';
import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import * as DB from '../db/types';
import { getMultipleWordsByLemmas, getWordByLemma } from '../db/words';
import { UnknownWordResponse } from '../routes/[lang]/api/word/unknown/+server';
import { filterClearlyKnownWords, wordsToUnknownWords } from './findProvidedWordsInAnswer';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { ExerciseKnowledge, Language, WordKnowledge } from './types';

export type WritingFeedbackOpts = z.infer<typeof writingFeedbackOptsSchema>;

export interface WritingFeedbackResponse {
	feedback: string;
	correctedSentence?: string | undefined;
	correctedPart?: string | undefined;
	unknownWords: UnknownWordResponse[];
	knowledge: (WordKnowledge & { word: DB.Word })[];
	userExercises: Omit<ExerciseKnowledge, 'sentenceId'>[];
}

export const writingFeedbackOptsSchema = z
	.object({
		exercise: z.literal('write'),
		entered: z.string(),
		word: z.string()
	})
	.or(
		z.object({
			exercise: z.literal('translate'),
			entered: z.string(),
			correct: z.string(),
			english: z.string()
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

	const userExercises: Omit<ExerciseKnowledge, 'sentenceId'>[] = [];

	function getCorrectedWord(error: { shouldBe: string }) {
		const i = correctedWordStrings.indexOf(error.shouldBe);

		if (i == -1) {
			console.warn(
				`Could not find the word "${error.shouldBe}" in the corrected sentence part "${feedback.correctedPart}".`
			);

			return undefined;
		}

		const lemma = correctedLemmas[i];

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
				wordId: word.id,
				word: word.word || null,
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
		wordId: null,
		word: null,
		// ?
		level: enteredWords.concat(newWords).reduce((acc, word) => Math.max(acc, word.level), 0),
		exercise: 'translate',
		isKnown: knewOverallSentence
	});

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
