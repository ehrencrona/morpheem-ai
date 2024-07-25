import { getSentence } from '../db/sentences';
import * as DB from '../db/types';
import {
	deleteUserExercise,
	getUserExercisesForSentence,
	upsertUserExercise
} from '../db/userExercises';
import { getWordsOfSentence } from '../db/words';
import { didNotKnow, didNotKnowFirst, knew, knewFirst, now } from './isomorphic/knowledge';
import { toWordStrings } from './toWordStrings';
import type { ExerciseKnowledge, Language } from './types';

export async function updateUserExercises(
	exercises: ExerciseKnowledge[],
	userId: number,
	language: Language
) {
	if (!exercises.length) {
		return {
			deleted: [] as number[],
			upserted: []
		};
	}

	validate(exercises);

	const bySentence = exercises.reduce((acc, exercise) => {
		const sentenceId = exercise.sentenceId!;

		if (!acc.has(sentenceId)) {
			acc.set(sentenceId, []);
		}

		acc.get(sentenceId)!.push(exercise);

		return acc;
	}, new Map<number, ExerciseKnowledge[]>());

	const resultBySentence = await Promise.all(
		new Array(...bySentence.entries()).map(([sentenceId, exercises]) =>
			handleSentenceExercises(exercises, { userId, sentenceId, language })
		)
	);

	return resultBySentence.reduce(
		(acc, { deleted, upserted }) => ({
			deleted: acc.deleted.concat(deleted),
			upserted: acc.upserted.concat(upserted)
		}),
		{ deleted: [] as number[], upserted: [] as DB.UserExercise[] }
	);
}

async function handleSentenceExercises(
	addExercises: ExerciseKnowledge[],
	{ userId, language, sentenceId }: { userId: number; language: Language; sentenceId: number }
) {
	let [existingExercises, sentence, sentenceWords] = await Promise.all([
		getUserExercisesForSentence(sentenceId, userId, language),
		getSentence(sentenceId, language),
		getWordsOfSentence(sentenceId, language)
	]);

	let originallyExistingExercises = existingExercises;

	const wordStrings = toWordStrings(sentence.sentence, language, { doLowerCase: true });
	const toDelete = new Set<number>();

	function getPhrase(e: DB.Exercise) {
		if (e.exercise == 'phrase-cloze') {
			return e.phrase.toLowerCase();
		} else if (e.exercise != 'translate') {
			const wordIndex = sentenceWords.findIndex((w) => w.id == e.wordId);

			return wordStrings[wordIndex] || '-';
		} else if (e.exercise == 'translate') {
			return sentence.sentence.toLowerCase();
		} else {
			return '-';
		}
	}

	function toString(e: DB.Exercise) {
		return getPhrase(e) + (e.id ? ` (${e.id})` : '');
	}

	console.log(
		`Request to update user exercises for sentence ${sentence.id}: add ${addExercises.map(toString).join(', ')} to existing ${existingExercises
			.map(toString)
			.join(', ')}`
	);

	function isEqual(a: DB.Exercise, b: DB.Exercise) {
		return getPhrase(a) == getPhrase(b);
	}

	function isSubsetOf(a: DB.Exercise, b: DB.Exercise) {
		return getPhrase(b).includes(getPhrase(a));
	}

	function deleteExercise(exercise: DB.Exercise) {
		const other = existingExercises.find((other) => isEqual(other, exercise));

		if (other) {
			toDelete.add(exercise.id!);
			existingExercises = existingExercises.filter((e) => e != other);
		}

		addExercises = addExercises.filter((e) => e != exercise);
	}

	// if an exercise to add already exists, update its ID
	addExercises.forEach((exercise) => {
		const existing = existingExercises.find((e) => isEqual(e, exercise));

		if (existing && exercise.id == null) {
			exercise.id = existing.id;
		}

		if (!existing && exercise.isKnown) {
			console.log(
				`Dropping exercise ${toString(exercise)} because it is already known and not in the database.`
			);

			deleteExercise(exercise);
		}
	});

	// we don't repeat translate or write exercises; the assumption is that more detailed exercises supercede them
	// if the user made a mistake.
	const doneWrites = addExercises.filter(
		(e) => (e.exercise == 'translate' || e.exercise == 'write') && e.isKnown
	);

	for (const exercise of doneWrites) {
		console.log(
			`Dropping exercise ${toString(exercise)} because we don't repeat write or translate.`
		);

		deleteExercise(exercise);
	}

	const allExercises = (existingExercises as DB.Exercise[]).concat(addExercises);

	// go through existing and new and if an exercise is dominated by another, drop it
	allExercises.forEach((exercise) => {
		const other = allExercises.find(
			(other) =>
				other != exercise &&
				(other.id ? other.id != exercise.id : other != exercise) &&
				!toDelete.has(other.id || -1) &&
				isSubsetOf(exercise, other)
		);

		if (other) {
			console.log(
				`Dropping exercise ${toString(exercise)} because it is a subset of ${toString(other)}.`
			);

			deleteExercise(exercise);
		}
	});

	console.log(
		`After merging exercises: upserting ${addExercises.length ? addExercises.map(toString).join(', ') : 'none'}.` +
			(toDelete.size
				? ` deleting ${originallyExistingExercises
						.filter((e) => toDelete.has(e.id!))
						.map(toString)
						.join(', ')}`
				: '')
	);

	for (const id of toDelete) {
		await deleteUserExercise(id, userId, language);
	}

	let upsert: DB.UserExercise[] = [];

	for (const exercise of addExercises) {
		const existing = existingExercises.find((e) => e.id == exercise.id);

		let knowledge: {
			alpha: number;
			beta: number | null;
		};

		if (existing) {
			knowledge = (exercise.isKnown ? knew : didNotKnow)(existing, {
				now: now(),
				exercise: exercise.exercise
			});
		} else {
			knowledge = exercise.isKnown
				? knewFirst(exercise.exercise)
				: didNotKnowFirst(exercise.exercise);
		}

		if (knowledge.beta && knowledge.beta >= 0.95) {
			console.log(`Done studying user exercise ${exercise.id} (${toString(exercise)}).`);

			if (exercise.id) {
				toDelete.add(exercise.id!);
			}
		} else {
			upsert.push({
				...exercise,
				...knowledge,
				id: exercise.id!,
				exercise: exercise.exercise as any,
				lastTime: now()
			});
		}
	}

	await Promise.all(
		new Array(...toDelete)
			.map((id) => deleteUserExercise(id, userId, language))
			.concat(upsert.map((e) => upsertUserExercise(e, userId, language)))
	);

	return {
		deleted: new Array<number>(...toDelete),
		upserted: upsert
	};
}

function validate(exercises: ExerciseKnowledge[]) {
	for (const exercise of exercises) {
		const shouldHaveWord = exercise.exercise != 'translate' && exercise.exercise != 'phrase-cloze';

		if (shouldHaveWord && exercise.wordId == undefined) {
			throw new Error(`Word ID was missing for user exercise ${JSON.stringify(exercise)}`);
		}

		if (
			exercise.exercise == 'phrase-cloze' &&
			(exercise.hint == undefined || exercise.phrase == undefined)
		) {
			throw new Error(
				`hint or phrase was missing for phrase-cloze exercise ${JSON.stringify(exercise)}`
			);
		}
	}
}
