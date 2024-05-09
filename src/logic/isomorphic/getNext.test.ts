import { expect, it } from 'vitest';
import type { AggKnowledgeForUser } from '../types';
import { getNextWord } from './getNext';

const knowledge: AggKnowledgeForUser[] = [
	{
		wordId: 296,
		alpha: 1,
		beta: 5333,
		time: 167898,
		level: 1
	},
	{
		wordId: 661,
		alpha: 1,
		beta: 1,
		time: 167898,
		level: 1
	}
];

it('getNextWord', () => {
	const word = getNextWord(knowledge);

	expect(word).toBe(661);
});
