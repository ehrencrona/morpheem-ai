import { expect, test } from 'vitest';
import { POLISH } from '../constants';
import { evaluateWrite } from './evaluateWrite';

test('evaluateWrite', async ({}) => {
	const result = await evaluateWrite(
		{
			exercise: 'translate',
			english: 'Has Martyna already been informed about the changes in the class schedule?',
			entered: 'Czy Martyna już była poinformowan o zmianach w planie zajęć?',
			correct: 'Czy Martyna już była poinformowana o zmianach w planie zajęć?'
		},
		POLISH
	);

	expect(result.correctedParts).toEqual([
		{
			correction: 'poinformowana',
			userWrote: 'poinformowan',
			english: null,
			severity: 1
		}
	]);
});
