import { filterUndefineds } from '$lib/filterUndefineds';
import { logError } from '$lib/logError';
import { dateToTime } from '../logic/isomorphic/knowledge';
import { Language } from '../logic/types';
import { db } from './client';
import { exerciseToKnowledgeType, knowledgeTypeToExercise } from './knowledgeTypes';
import { UserExercise } from './types';

export async function upsertUserExercise(
	exercise: UserExercise,
	userId: number,
	language: Language
): Promise<void> {
	const exercise_type = exerciseToKnowledgeType(exercise.exercise);

	const { sentenceId, level, alpha, beta } = exercise;

	const wordId =
		exercise.exercise != 'translate' && exercise.exercise != 'phrase-cloze'
			? exercise.wordId
			: null;

	const hint = exercise.exercise == 'phrase-cloze' ? exercise.hint : null;
	const phrase = exercise.exercise == 'phrase-cloze' ? exercise.phrase : null;

	await db
		.withSchema(language.code)
		.insertInto('user_exercises')
		.values({
			id: exercise.id != null ? exercise.id : undefined,
			user_id: userId,
			sentence_id: sentenceId,
			word_id: wordId,
			exercise_type,
			level,
			alpha,
			beta,
			hint,
			phrase,
			last_time: new Date()
		})
		.onConflict((oc) =>
			oc.columns(['id', 'user_id']).doUpdateSet({
				sentence_id: sentenceId,
				word_id: wordId,
				exercise_type,
				level,
				alpha,
				beta,
				hint,
				phrase,
				last_time: new Date()
			})
		)
		.execute();
}

function rowToExercise(row: {
	id: number;
	sentence_id: number;
	word_id: number | null;
	exercise_type: number;
	alpha: number;
	beta: number | null;
	last_time: Date;
	level: number;
	word: string | null;
	hint: string | null;
	phrase: string | null;
}) {
	const {
		id,
		sentence_id,
		word_id,
		exercise_type,
		alpha,
		beta,
		last_time,
		level,
		word,
		hint,
		phrase
	} = row;

	const exerciseType = knowledgeTypeToExercise(exercise_type);

	if (exerciseType == 'translate') {
		return {
			id,
			exercise: exerciseType,
			sentenceId: sentence_id,
			lastTime: dateToTime(last_time),
			level,
			alpha,
			beta
		};
	} else if (exerciseType == 'phrase-cloze') {
		if (hint == null || phrase == null) {
			throw new Error(`Hint or phrase is null for phrase-cloze exercise ${id}`);
		}

		return {
			id,
			exercise: exerciseType,
			sentenceId: sentence_id,
			lastTime: dateToTime(last_time),
			level,
			alpha,
			beta,
			phrase,
			hint
		};
	} else {
		if (word == null || word_id == null) {
			throw new Error(`Word is null for exercise ${id}`);
		}

		return {
			id,
			sentenceId: sentence_id,
			wordId: word_id,
			exercise: exerciseType,
			lastTime: dateToTime(last_time),
			level,
			alpha,
			beta,
			word
		};
	}
}

export async function getUserExercise(
	id: number,
	userId: number,
	language: Language
): Promise<UserExercise | undefined> {
	const row = await db
		.withSchema(language.code)
		.selectFrom('user_exercises')
		.leftJoin('words', 'user_exercises.word_id', 'words.id')
		.select([
			'user_exercises.id',
			'sentence_id',
			'word_id',
			'exercise_type',
			'alpha',
			'beta',
			'last_time',
			'user_exercises.level',
			'word',
			'hint',
			'phrase'
		])
		.where('user_exercises.user_id', '=', userId)
		.where('user_exercises.id', '=', id)
		.executeTakeFirst();

	if (row) {
		return rowToExercise(row);
	} else {
		return undefined;
	}
}

export async function getUserExercises(
	userId: number,
	language: Language,
	orderBy?: 'last_time desc',
	limit?: number
): Promise<UserExercise[]> {
	let query = db
		.withSchema(language.code)
		.selectFrom('user_exercises')
		.leftJoin('words', 'user_exercises.word_id', 'words.id')
		.select([
			'user_exercises.id',
			'sentence_id',
			'word_id',
			'exercise_type',
			'alpha',
			'beta',
			'last_time',
			'user_exercises.level',
			'word',
			'hint',
			'phrase'
		])
		.where('user_id', '=', userId);

	if (orderBy == 'last_time desc') {
		query = query.orderBy('last_time desc');
	}

	if (limit != null) {
		query = query.limit(limit);
	}

	return filterUndefineds(
		(await query.execute()).map((e) => {
			try {
				return rowToExercise(e);
			} catch (error: any) {
				error.message += ` in exercise ${JSON.stringify(e)}`;
				logError(error);
			}
		})
	);
}

export async function getUserExercisesForSentence(
	sentenceId: number,
	userId: number,
	language: Language
): Promise<UserExercise[]> {
	return (
		await db
			.withSchema(language.code)
			.selectFrom('user_exercises')
			.leftJoin('words', 'user_exercises.word_id', 'words.id')
			.select([
				'user_exercises.id',
				'sentence_id',
				'word_id',
				'exercise_type',
				'alpha',
				'beta',
				'last_time',
				'user_exercises.level',
				'word',
				'hint',
				'phrase'
			])
			.where('user_id', '=', userId)
			.where('sentence_id', '=', sentenceId)
			.execute()
	).map(rowToExercise);
}

export async function deleteUserExercise(id: number, userId: number, language: Language) {
	await db
		.withSchema(language.code)
		.deleteFrom('user_exercises')
		.where('id', '=', id)
		.where('user_id', '=', userId)
		.execute();
}
