import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { now, nt } from './isomorphic/knowledge';
import { getBeginnerKnowledge } from './knowledge';
import { userId } from './user';

export async function getAggregateKnowledge() {
	let knowledge = await getAggregateKnowledgeForUser({ userId });

	const easiestUnstudied = await getEasiestUnstudiedWords();

	knowledge = knowledge.concat(
		easiestUnstudied.map(({ id, level, word }) => ({
			alpha: nt,
			beta: null,
			wordId: id,
			level,
			lastTime: now() - 20,
			word,
			studied: false
		}))
	);

	if (knowledge.length === 0) {
		knowledge = await getBeginnerKnowledge();
	}

	return knowledge;
}
