import type { SentencesWithWords } from '../../routes/api/sentences/withword/[word]/+server';
import type { AggKnowledgeForUser } from '../types';
import { didNotKnowFirst, expectedKnowledge, knewFirst, knowledgeGain, now } from './knowledge';

export function getNextWord(knowledge: AggKnowledgeForUser[]) {
	return getNextWords(knowledge)[0];
}

export function getNextWords(knowledge: AggKnowledgeForUser[], count = 5) {
	const score = knowledge.map(
		(k) =>
			(knowledgeGain(k, {
				now: now(),
				lastTime: k.time
			}) *
				(2 - k.level / 100) *
				(2 - k.level / 100)) /
			4
	);

	// return the five words with highest scores
	const indexes = score
		.map((s, i) => ({ s, i }))
		.sort((a, b) => b.s - a.s)
		.slice(0, count)
		.map((x) => x.i);

	const word = knowledge[indexes[0]];

	console.log(
		`knowledge of ${word.wordId}, index ${indexes[0]}: ${word.alpha}/${word.beta}, age ${now() - word.time} = ${score[indexes[0]]}`
	);

	console.log(
		'next words:',
		indexes.map(
			(i) =>
				`${knowledge[i].wordId} (score ${Math.round(score[i] * 100)}%, level ${knowledge[i].level})${knowledge[i].studied === false ? ' unstudied' : ''}`
		)
	);

	return indexes.map((i) => knowledge[i].wordId);
}

export function getNextSentence(
	sentences: SentencesWithWords,
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
				lastTime: wordKnowledge.time
			});

			message += ` (${Math.round(score * 100)}% known)`;

			return score;
		});

		if (sentence.lastSeen) {
			message += '. Has been seen.';
		}

		const score = Math.pow(
			wordScore.reduce((a, b) => a * b, 1) * (sentence.lastSeen ? 0.6 : 1),
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
