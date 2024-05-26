import { AggKnowledgeForUser } from '../types';
import { expectedKnowledge, now } from './knowledge';

export function calculateWordsKnown(knowledge: Omit<AggKnowledgeForUser, 'word' | 'level'>[]) {
	const n = now();

	const read = knowledge.reduce(
		(acc, wk) => acc + expectedKnowledge(wk, { now: n, exercise: 'read' }),
		0
	);

	const write = knowledge.reduce(
		(acc, wk) => acc + expectedKnowledge(wk, { now: n, exercise: 'write' }),
		0
	);

	return { read: Math.round(read), write: Math.round(write) };
}
