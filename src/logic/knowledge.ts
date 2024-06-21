import { AggKnowledgeForUser } from '../db/types';
import { getWordsBelowLevel } from '../db/words';
import { now } from './isomorphic/knowledge';
import type { Language } from './types';

/** TODO */
export async function getBeginnerKnowledge(language: Language): Promise<AggKnowledgeForUser[]> {
	const words = await getWordsBelowLevel(10, language);

	return words.slice(0, 4).map((word) => ({
		wordId: word.id,
		level: word.level,
		word: word.word,
		wordType: word.type,
		lastTime: now(),
		alpha: 1,
		beta: 1,
		source: 'unstudied'
	}));
}
