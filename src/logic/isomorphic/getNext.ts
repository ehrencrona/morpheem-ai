import { getPastDue, getReadPreference, getRepetitionTime } from '$lib/settings';
import { AggKnowledgeForUser, ExerciseSource, Scoreable } from '../../db/types';
import type { CandidateSentenceWithWords, ExerciseType } from '../types';
import { expectedKnowledge, calculateRepetitionValue, now } from './knowledge';
import * as DB from '../../db/types';

export function getExerciseForKnowledge(knowledge: AggKnowledgeForUser[]) {
	return getExercisesForKnowledge(knowledge)[0];
}

type ExerciseForKnowledge = DB.ScoreableExercise & { wordType: DB.WordType | undefined };

export function getExercisesForKnowledge(knowledge: AggKnowledgeForUser[]): ExerciseForKnowledge[] {
	return knowledge
		.filter(({ wordType }) => wordType != 'name')
		.reduce(
			(acc, k) => [
				...acc,
				{
					id: null,
					...k,
					exercise: 'read',
					sentenceId: -1
				} satisfies ExerciseForKnowledge,
				{
					id: null,
					...k,
					exercise: 'write',
					sentenceId: -1
				} satisfies ExerciseForKnowledge
			],
			[] as ExerciseForKnowledge[]
		);
}

export function scoreExercises<
	Exercise extends Scoreable & { exercise: ExerciseType; source: ExerciseSource }
>(exercises: Exercise[]): (Exercise & { score: number })[] {
	const n = now();

	const repetitionTime = getRepetitionTime();
	const pastDue = getPastDue();
	const readPreference = getReadPreference();

	const scores = exercises.map((e) => ({
		...e,
		score:
			(calculateRepetitionValue(e, {
				now: n,
				exercise: e.exercise,
				repetitionTime,
				pastDue
			}) *
				(e.exercise == 'read' ? 1 + readPreference / 4 : 1) *
				(3 - Math.sqrt(e.level / 100))) /
			2
	}));

	return scores.sort((a, b) => b.score - a.score);
}

export function calculateSentenceWriteKnowledge(
	sentence: CandidateSentenceWithWords,
	knowledge: AggKnowledgeForUser[]
) {
	const n = now();

	return (
		sentence.words.reduce((acc, word) => {
			const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

			if (!wordKnowledge && word.type == 'cognate') {
				return 0.5;
			}

			if (!wordKnowledge && word.type == 'name') {
				return 0.8;
			}

			return (
				acc *
				(wordKnowledge
					? expectedKnowledge(wordKnowledge, {
							now: n,
							exercise: 'write'
						})
					: 0.2)
			);
		}, 1) **
		(1 / sentence.words.length)
	);
}

/** If a word is cognate, we discount the level. */
export function getLevelForCognate(level: number) {
	return Math.round(level / 4);
}

export function getNextSentence(
	sentences: CandidateSentenceWithWords[],
	knowledge: AggKnowledgeForUser[],
	wordStudied: number,
	exercise: ExerciseType
) {
	const messages: { score: number; message: string }[] = [];
	const n = now();

	const scores = sentences.map((sentence) => {
		let message = `${sentence.sentence}: `;

		const wordScore = sentence.words.map((word) => {
			if (word.id === wordStudied) {
				return 1;
			}

			message += `, ${word.word}`;

			const wordKnowledge = knowledge.find((k) => k.wordId === word.id);

			if (!wordKnowledge) {
				const scoreForLevel = (level: number) => (100 - level) / 100 / 1.5;

				if (word.type == 'cognate' || word.type == 'name') {
					message += ` (${word.type}, ${word.level}% level)`;

					return scoreForLevel(getLevelForCognate(word.level));
				} else {
					message += ` (${word.level}% level)`;

					// TODO: this should consider what level the user is at.
					return scoreForLevel(word.level);
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
			wordScore.reduce((a, b) => a * b, 1) * lastSeenFactor(sentence.lastSeen, n),
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

function lastSeenFactor(lastSeen: number | undefined, now: number) {
	if (!lastSeen) {
		return 1;
	}

	const age = now - lastSeen;

	if (age < 60) {
		return 0.1;
	} else if (age < 24 * 60) {
		return 0.2;
	} else {
		return 0.3;
	}
}
