import type { SentencesWithWords } from '../../routes/api/sentences/withword/[word]/+server';
import type { AggKnowledgeForUser } from '../types';
import { expectedKnowledge, knowledgeGain, now } from './knowledge';

export function getNextWord(knowledge: AggKnowledgeForUser[]) {
	return getNextWords(knowledge)[0];
}

export function getNextWords(knowledge: AggKnowledgeForUser[]) {
	const score = knowledge.map((k) =>
		knowledgeGain(k, {
			now: now(),
			lastTime: k.time
		})
	);

	// return the five words with highest scores
	const indexes = score
		.map((s, i) => ({ s, i }))
		.sort((a, b) => b.s - a.s)
		.slice(0, 5)
		.map((x) => x.i);

	const word = knowledge[indexes[0]];

	console.log(
		`knowledge of ${word.wordId}, index ${indexes[0]}: ${word.alpha}/${word.beta}, age ${now() - word.time} = ${score[indexes[0]]}`
	);

	console.log(
		'next five words:',
		indexes.map((i) => knowledge[i].wordId)
	);

	return indexes.map((i) => knowledge[i].wordId);
}

export function getNextSentence(
	sentences: SentencesWithWords,
	knowledge: AggKnowledgeForUser[],
	word_studied: number
) {
	const score = sentences.map((sentence) => {
		const sentenceScore = sentence.words.map((word) => {
			if (word.id === word_studied) {
				return 1;
			}

			const wordScore = knowledge.find((k) => k.wordId === word.id);

			if (!wordScore) {
				// TODO: this should be estimated based on how hard the word is
				// and what level the user is at.
				return 0.2;
			}

			return expectedKnowledge(wordScore, {
				now: now(),
				lastTime: wordScore.time
			});
		});

		return (
			(Math.log(sentenceScore.reduce((a, b) => a * b, 1)) / sentence.words.length) *
			(sentence.lastSeen ? 1 : 2)
		);
	});

	const maxIndex = score.indexOf(Math.min(...score));

	return sentences[maxIndex];
}
