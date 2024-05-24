import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { now } from './isomorphic/knowledge';
import { getBeginnerKnowledge } from './knowledge';
import { userId } from './user';

export async function getAggregateKnowledge() {
	let knowledge = await getAggregateKnowledgeForUser({ userId });

	const easiestUnstudied = await getEasiestUnstudiedWords();

	knowledge = knowledge.concat(
		easiestUnstudied.map(({ id, level, word }) => ({
			alpha: 0.5,
			beta: null,
			wordId: id,
			level,
			time: now() - 2.9 * 24 * 60,
			word,
			studied: false
		}))
	);

	if (knowledge.length === 0) {
		knowledge = await getBeginnerKnowledge();
	}

	return knowledge;
}
