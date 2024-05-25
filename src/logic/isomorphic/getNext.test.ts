import { expect, it } from 'vitest';
import type { AggKnowledgeForUser } from '../types';
import { getNextWord } from './getNext';

const knowledge: AggKnowledgeForUser[] = [
	{
		wordId: 296,
		alpha: 1,
		beta: 5333,
		lastTime: 167898,
		level: 1,
		word: 'a'
	},
	{
		wordId: 661,
		alpha: 1,
		beta: 1,
		lastTime: 167898,
		level: 1,
		word: 'b'
	}
];

it('getNextWord', () => {
	const word = getNextWord(knowledge);

	expect(word).toBe(661);
});
