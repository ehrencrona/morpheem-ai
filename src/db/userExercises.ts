import { dateToTime } from '../logic/isomorphic/knowledge';
import { Language } from '../logic/types';
import { db } from './client';
import { exerciseToKnowledgeType, knowledgeTypeToExercise } from './knowledgeTypes';
import { UserExercise } from './types';

export async function upsertUserExercise(
	{ sentenceId, wordId, exercise, level, alpha, beta }: Omit<UserExercise, 'lastTime'>,
	userId: number,
	language: Language
): Promise<void> {
	const exercise_type = exerciseToKnowledgeType(exercise);

	await db
		.withSchema(language.code)
		.insertInto('user_exercises')
		.values({
			user_id: userId,
			sentence_id: sentenceId,
			word_id: wordId,
			exercise_type,
			level,
			alpha,
			beta,
			last_time: new Date()
		})
		.onConflict((oc) =>
			oc.columns(['user_id', 'sentence_id']).doUpdateSet({
				level,
				alpha,
				beta,
				exercise_type,
				last_time: new Date()
			})
		)
		.execute();
}

export async function getUserExercise(
	{ sentenceId, wordId, userId }: { sentenceId: number; wordId: number | null; userId: number },
	language: Language
): Promise<UserExercise | undefined> {
	const row = await db
		.withSchema(language.code)
		.selectFrom('user_exercises')
		.leftJoin('words', 'user_exercises.word_id', 'words.id')
		.select([
			'sentence_id',
			'word_id',
			'exercise_type',
			'alpha',
			'beta',
			'last_time',
			'user_exercises.level',
			'word'
		])
		.where('user_id', '=', userId)
		.where('sentence_id', '=', sentenceId)
		.where('word_id', '=', wordId)
		.executeTakeFirst();

	if (row) {
		const { sentence_id, word_id, exercise_type, alpha, beta, last_time, level, word } = row;

		return {
			sentenceId: sentence_id,
			wordId: word_id,
			exercise: knowledgeTypeToExercise(exercise_type),
			lastTime: dateToTime(last_time),
			level,
			alpha,
			beta,
			word
		};
	} else {
		return undefined;
	}
}

export async function getUserExercises(
	userId: number,
	language: Language
): Promise<UserExercise[]> {
	return (
		await db
			.withSchema(language.code)
			.selectFrom('user_exercises')
			.leftJoin('words', 'user_exercises.word_id', 'words.id')
			.select([
				'sentence_id',
				'word_id',
				'exercise_type',
				'alpha',
				'beta',
				'last_time',
				'user_exercises.level',
				'word'
			])
			.where('user_id', '=', userId)
			.execute()
	).map(({ sentence_id, word_id, exercise_type, alpha, beta, last_time, level, word }) => ({
		sentenceId: sentence_id,
		wordId: word_id,
		word,
		exercise: knowledgeTypeToExercise(exercise_type),
		lastTime: dateToTime(last_time),
		level,
		alpha,
		beta
	}));
}