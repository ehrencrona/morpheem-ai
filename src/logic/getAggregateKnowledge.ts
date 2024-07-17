import { getAggregateKnowledgeForUser, getEasiestUnstudiedWords } from '../db/knowledge';
import { WordType } from '../db/types';
import { now, nt } from './isomorphic/knowledge';
import { Language } from './types';

export async function getAggregateKnowledge(
	userId: number,
	{ language, upToUnit }: { language: Language; upToUnit?: number }
) {
	let knowledge = await getAggregateKnowledgeForUser({ userId, language, upToUnit });

	const easiestUnstudied = await getEasiestUnstudiedWords({
		userId,
		language,
		limit: 10,
		upToUnit
	});

	knowledge = knowledge.concat(
		easiestUnstudied.map(({ id, level, word, type }) => ({
			alpha: nt,
			beta: null,
			wordId: id,
			level,
			wordType: type ? (type as WordType) : undefined,
			lastTime: now() - 5,
			word,
			source: 'unstudied'
		}))
	);

	return knowledge;
}
