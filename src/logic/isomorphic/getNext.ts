import { getPastDue, getRepetitionTime } from '$lib/settings';
import { AggKnowledgeForUser, ExerciseSource, Scoreable } from '../../db/types';
import type { CandidateSentenceWithWords, ExerciseType } from '../types';
import { expectedKnowledge, calculateRepetitionValue, now } from './knowledge';

export function getExerciseForKnowledge(knowledge: AggKnowledgeForUser[]) {
	return getExercisesForKnowledge(knowledge)[0];
}

export function getExercisesForKnowledge(knowledge: AggKnowledgeForUser[]) {
	return knowledge.reduce(
		(acc, k) => [
			...acc,
			{
				...k,
				exercise: 'read' as ExerciseType
			},
			{
				...k,
				exercise: (Math.random() > 0.75 ? 'write' : 'cloze') as ExerciseType
			}
		],
		[] as (AggKnowledgeForUser & { exercise: ExerciseType })[]
	);
}

export function scoreExercises<
	Exercise extends Scoreable & { exercise: ExerciseType; source: ExerciseSource }
>(exercises: Exercise[]): (Exercise & { score: number })[] {
	const n = now();

	const repetitionTime = getRepetitionTime();
	const pastDue = getPastDue();

	const scores = exercises.map((e) => ({
		...e,
		score:
			(calculateRepetitionValue(e, {
				now: n,
				exercise: e.exercise,
				repetitionTime,
				pastDue
			}) *
				(2 - e.level / 100)) /
			2
	}));

	return scores.sort((a, b) => b.score - a.score);
}

export function getNextSentence(
	sentences: CandidateSentenceWithWords[],
	knowledge: AggKnowledgeForUser[],
	wordStudied: number,
	exercise: ExerciseType
) {
	const messages: { score: number; message: string }[] = [];

	const scores = sentences.map((sentence) => {
		let message = `${sentence.sentence}: `;

		const wordScore = sentence.words.map((word) => {
			if (word.id === wordStudied) {
				return 1;
			}

			message += `, ${word.word}`;

			const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

			if (!wordKnowledge) {
				if (word.cognate) {
					message += ' (cognate)';
					return 0.8;
				} else {
					message += ` (${word.level}% level)`;

					// TODO: this should consider what level the user is at.
					return (100 - word.level) / 100 / 1.5;
				}
			}

			const score = expectedKnowledge(wordKnowledge, {
				now: now(),
				exercise: exercise == 'read' || exercise == 'cloze' ? 'read' : 'write'
			});

			message += ` (${word.id}, ${Math.round(score * 100)}% known)`;

			return score;
		});

		if (sentence.lastSeen) {
			message += '. Has been seen.';
		}

		const score = Math.pow(
			wordScore.reduce((a, b) => a * b, 1) * (sentence.lastSeen ? 0.5 : 1),
			1 / (sentence.words.length + 1)
		);

		messages.push({ score, message });

		return score;
	});

	if (scores.length === 0) {
		return null;
	}

	const maxIndex = scores.indexOf(Math.max(...scores));

	// print messages from five highest scores
	messages
		.sort((a, b) => b.score - a.score)
		.slice(0, 5)
		.forEach((m) => {
			console.log(`${m.message} => ${Math.round(m.score * 100)}%`);
		});

	return { sentence: sentences[maxIndex], score: scores[maxIndex] };
}
