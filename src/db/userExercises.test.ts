import { test } from 'vitest';
import { POLISH } from '../constants';
import { upsertUserExercise } from './userExercises';
import { getSentenceIds } from './sentences';

test('userExercises', async ({}) => {
	const sentenceId = (await getSentenceIds(POLISH))[0].id;
	const userId = 4711;

	await upsertUserExercise(
		{
			sentenceId,
			exercise: 'cloze',
			level: 1,
			alpha: 1,
			beta: 1,
			id: null,
			word: null,
			wordId: null
		},
		userId,
		POLISH
	);

	await upsertUserExercise(
		{
			sentenceId,
			exercise: 'cloze',
			level: 1,
			alpha: 1,
			beta: 1,
			word: null,
			wordId: null
		},
		userId,
		POLISH
	);
});
