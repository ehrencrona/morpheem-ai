import type { AggKnowledgeForUser, CandidateSentenceWithWords, Exercise } from '../types';
import { expectedKnowledge, calculateRepetitionValue, now } from './knowledge';

export function getNextWord(knowledge: AggKnowledgeForUser[]) {
	return getNextWords(knowledge)[0];
}

export function getNextWords(knowledge: AggKnowledgeForUser[], count = 5) {
	const n = now();

	const scores = knowledge.reduce(
		(acc, k) => [
			...acc,
			{
				...k,
				exercise: 'read' as Exercise,
				score:
					(calculateRepetitionValue(k, {
						now: n,
						exercise: 'read'
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
						exercise: 'write'
					}) *
						(2 - k.level / 100)) /
					2
			}
		],
		[] as (AggKnowledgeForUser & { score: number; exercise: Exercise })[]
	);

	// return the five words with highest scores
	const topScores = scores.sort((a, b) => b.score - a.score).slice(0, count);

	const word = topScores[0];

	const toPercent = (n: number | null) => (n != null ? Math.round(n * 100) + '%' : '-');

	console.log(
		`Knowledge of ${word.word}: ${toPercent(word.alpha)}/${toPercent(word.beta)}, age ${now() - word.lastTime} = ${word.score}`
	);

	console.log(
		'Next words:\n' +
			topScores
				.map(
					(i, j) =>
						`${j + 1}. ${i.word} ${i.exercise} (${i.wordId}, score ${Math.round(i.score * 100)}%, knowledge ${Math.round(
							100 * expectedKnowledge(i, { now: n, exercise: i.exercise })
						)}% level ${i.level})${i.studied === false ? ' unstudied' : ''}`
				)
				.join(`\n`)
	);

	console.log(
		'Next unstudied word\n' +
			scores
				.filter((s) => s.studied == false)
				.map(
					(i) =>
						`${i.word} ${i.exercise} (${i.wordId}, score ${Math.round(i.score * 100)}%, knowledge ${Math.round(
							100 * expectedKnowledge(i, { now: n, exercise: i.exercise })
						)}% level ${i.level})${i.studied === false ? ' unstudied' : ''}`
				)
	);

	return topScores.map(({ wordId, exercise }) => ({ wordId, exercise }));
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
