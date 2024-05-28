import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { now, nt } from './isomorphic/knowledge';
import { getBeginnerKnowledge } from './knowledge';
import { Language } from './types';

export async function getAggregateKnowledge(userId: number, language: Language) {
	let knowledge = await getAggregateKnowledgeForUser({ userId, language });

	const easiestUnstudied = await getEasiestUnstudiedWords(language);

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
		knowledge = await getBeginnerKnowledge(language);
	}

	return knowledge;
}
