import { test } from 'vitest';
import { POLISH } from '../constants';
import { evaluateWrite } from './evaluateWrite';

test('evaluateWrite', async ({}) => {
	const result = await evaluateWrite(
		{
			exercise: 'translate',
			english: 'Has Martyna already been informed about the changes in the class schedule?',
			entered: 'Czy Martyna już była poinformowan o zmianach w planie zajęć?'
		},
		POLISH
	);

	console.log(result);
});
