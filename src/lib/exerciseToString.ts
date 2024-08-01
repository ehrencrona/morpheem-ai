import * as DB from '../db/types';
import { expectedKnowledge, now } from '../logic/isomorphic/knowledge';

export function exerciseToString(e: DB.Exercise | DB.UserExercise) {
	const n = now();

	return (
		`${e.exercise}${e.id != null ? ` (${e.id})` : ''}${'word' in e ? ` ${e.word} (${e.wordId})` : ''}${e.sentenceId != -1 ? `, sentence ${e.sentenceId}` : ''}${'score' in e ? `, score ${Math.round((e.score as number) * 100)}%` : ''}` +
		(isUserExercise(e)
			? `, age ${n - e.lastTime}, knowledge ${Math.round(
					100 * expectedKnowledge(e, { now: n, exercise: e.exercise })
				)}% level ${e.level})`
			: '')
	);
}

function isUserExercise(e: DB.Exercise | DB.UserExercise): e is DB.UserExercise {
	return 'score' in e;
}
