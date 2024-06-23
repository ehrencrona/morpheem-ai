import { parallelize } from '$lib/parallelize';
import { upsertUserExercise } from '../db/userExercises';
import { addSentence } from './addSentence';
import type { Cloze } from './generateCloze';
import { getWordInSentence } from './getWordInSentence';
import { lemmatizeSentences } from './lemmatize';
import { ExerciseType, Language } from './types';

export async function storeCloze(
	clozes: Cloze[],
	{ language, userId }: { language: Language; userId: number }
) {
	const sentenceStrings = clozes.map(({ exercise, answer }) => exercise.replace('___', answer));

	const lemmas = await lemmatizeSentences(sentenceStrings, { language });

	await parallelize(
		clozes.map(({ exercise, answer }, i) => async () => {
			const sentence = await addSentence(exercise.replace('___', answer), {
				language,
				english: undefined,
				lemmas: lemmas[i],
				userId
			});

			const word = await getWordInSentence(answer, sentence.id, sentence.words, language);

			const userExercise = {
				sentenceId: sentence.id,
				wordId: word.id,
				word: word.word,
				// maybe sometimes cloze-inflection?
				exercise: 'cloze' as ExerciseType,
				level: word.level,
				alpha: 0,
				beta: null
			};

			await upsertUserExercise(userExercise, userId, language);

			console.log(`Stored cloze "${exercise}" as sentence ${sentence.id} with word ${word.id}`);
		}),
		3
	);
}
