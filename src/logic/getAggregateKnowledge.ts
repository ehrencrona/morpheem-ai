import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { now, nt } from './isomorphic/knowledge';
import { getBeginnerKnowledge } from './knowledge';
import { Language } from './types';

export async function getAggregateKnowledge(userId: number, language: Language) {
	let knowledge = await getAggregateKnowledgeForUser({ userId, language });

	const easiestUnstudied = await getEasiestUnstudiedWords({ userId, language, limit: 10 });

	knowledge = knowledge.concat(
		easiestUnstudied.map(({ id, level, word }) => ({
			alpha: nt,
			beta: null,
			wordId: id,
			level,
			lastTime: now() - 5,
			word,
			source: 'unstudied'
		}))
	);

	if (knowledge.length === 0) {
		knowledge = await getBeginnerKnowledge(language);
	}

	return knowledge;
}
