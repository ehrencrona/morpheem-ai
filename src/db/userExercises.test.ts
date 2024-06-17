import { test } from 'vitest';
import { POLISH } from '../constants';
import { upsertUserExercise } from './userExercises';

test('userExercises', async ({}) => {
	await upsertUserExercise(
		{
			sentenceId: 1,
			exercise: 'cloze',
			level: 1,
			alpha: 1,
			beta: 1,
			word: null,
			wordId: null
		},
		1,
		POLISH
	);

	await upsertUserExercise(
		{
			sentenceId: 1,
			exercise: 'cloze',
			level: 1,
			alpha: 1,
			beta: 1,
			word: null,
			wordId: null
		},
		1,
		POLISH
	);
});
