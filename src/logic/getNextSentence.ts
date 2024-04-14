import { getSentence, getSentenceIds } from '../db/sentences';

export async function getNextSentence() {
	const sentenceIds = (await getSentenceIds()).map(({ id }) => id);

	const sentenceId = sentenceIds[Math.floor(Math.random() * sentenceIds.length)];

	return await getSentence(sentenceId);
}
