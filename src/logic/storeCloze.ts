import { parallelize } from '$lib/parallelize';
import { UserExercise } from '../db/types';
import { upsertUserExercise } from '../db/userExercises';
import { addSentence } from './addSentence';
import type { Cloze } from './generateCloze';
import { getWordInSentence } from './getWordInSentence';
import { didNotKnowFirst, now } from './isomorphic/knowledge';
import { lemmatizeSentences } from './lemmatize';
import { toWordStrings } from './toWordStrings';
import { ExerciseKnowledge, Language } from './types';

export async function storeCloze(
	clozes: Cloze[],
	{ language, userId }: { language: Language; userId: number }
) {
	const sentenceStrings = clozes.map(({ cloze, rightAnswer }) => cloze.replace('___', rightAnswer));

	const lemmas = await lemmatizeSentences(sentenceStrings, { language });

	let knowledge: ExerciseKnowledge[] = [];

	await parallelize(
		clozes.map(({ cloze: exercise, rightAnswer, englishMissingPart }, i) => async () => {
			const isSingleWord = toWordStrings(rightAnswer, language).length == 1;

			const sentence = await addSentence(exercise.replace('___', rightAnswer), {
				language,
				english: undefined,
				lemmas: lemmas[i],
				userId
			});

			let userExercise: UserExercise;

			if (isSingleWord) {
				const word = await getWordInSentence(rightAnswer, sentence.id, sentence.words, language);

				userExercise = {
					exercise: 'cloze',
					id: null,
					sentenceId: sentence.id,
					wordId: word.id,
					word: word.word,
					// maybe sometimes cloze-inflection?
					level: word.level,
					lastTime: now(),
					...didNotKnowFirst('cloze')
				};

				console.log(
					`Storing cloze "${exercise}" as sentence ${sentence.id} with word ${word.id}...`
				);
			} else {
				userExercise = {
					exercise: 'phrase-cloze',
					id: null,
					sentenceId: sentence.id,
					phrase: rightAnswer,
					hint: englishMissingPart,
					level: 0,
					lastTime: now(),
					...didNotKnowFirst('cloze')
				};

				console.log(
					`Storing cloze "${exercise}" as sentence ${sentence.id} with phrase ${rightAnswer}...`
				);
			}

			await upsertUserExercise(userExercise, userId, language);

			knowledge.push({
				...userExercise,
				isKnown: false
			});
		}),
		3
	);

	return knowledge;
}
