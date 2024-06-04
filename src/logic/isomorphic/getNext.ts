import { getNewWordValue, getRepetitionTime } from '$lib/settings';
import type { AggKnowledgeForUser, CandidateSentenceWithWords, Exercise } from '../types';
import { expectedKnowledge, calculateRepetitionValue, now } from './knowledge';

export function getNextWord(knowledge: AggKnowledgeForUser[]) {
	return getNextWords(knowledge)[0];
}

export function getNextWords(knowledge: AggKnowledgeForUser[], count = 5) {
	const n = now();

	const repetitionTime = getRepetitionTime();
	const newWordValue = getNewWordValue();

	const scores = knowledge
		.reduce(
			(acc, k) => [
				...acc,
				{
					...k,
					exercise: 'read' as Exercise,
					score:
						(calculateRepetitionValue(k, {
							now: n,
							exercise: 'read',
							repetitionTime,
							newWordValue
						}) *
							(2 - k.level / 100)) /
						2
				},
				{
					...k,
					exercise: (Math.random() > 0.75 ? 'write' : 'cloze') as Exercise,
					score:
						(calculateRepetitionValue(k, {
							now: n,
							exercise: 'write',
							repetitionTime,
							newWordValue
						}) *
							(2 - k.level / 100)) /
						2
				}
			],
			[] as (AggKnowledgeForUser & { score: number; exercise: Exercise })[]
		)
		.filter((k) => k.score > 0.02);

	const topScores = scores.sort((a, b) => b.score - a.score);

	const word = topScores[0];

	const toPercent = (n: number | null) => (n != null ? Math.round(n * 100) + '%' : '-');

	console.log(
		`Knowledge of ${word.word}: ${toPercent(word.alpha)}/${toPercent(word.beta)}, age ${n - word.lastTime} = ${toPercent(word.score)}`
	);

	console.log(
		'Next words:\n' +
			topScores
				.filter((s) => s.studied == undefined)
				.slice(0, 10)
				.map(
					(i, j) =>
						`${j + 1}. ${i.word} ${i.exercise} (${i.wordId}, score ${Math.round(i.score * 100)}%, age ${n - i.lastTime}, knowledge ${Math.round(
							100 * expectedKnowledge(i, { now: n, exercise: i.exercise })
						)}% level ${i.level})`
				)
				.join(`\n`)
	);

	console.log(
		'Next unstudied words\n' +
			topScores
				.filter((s) => s.studied == false && s.score > 0)
				.slice(0, 5)
				.map(
					(unstudied, i) =>
						`${i + 1}. ${unstudied.word} ${unstudied.exercise} (${unstudied.wordId}, score ${Math.round(unstudied.score * 100)}%, level ${unstudied.level})`
				)
				.join('\n')
	);

	return topScores
		.slice(0, count)
		.map(({ wordId, exercise, studied }) => ({ wordId, exercise, studied }));
}

export function getNextSentence(
	sentences: CandidateSentenceWithWords[],
	knowledge: AggKnowledgeForUser[],
	wordStudied: number
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
				exercise: 'read'
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
