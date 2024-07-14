import { expect, test } from 'vitest';
import { generateExampleSentences, simplifySentences } from './generateExampleSentences';
import { POLISH } from '../constants';

test('generateExampleSentences', async ({}) => {
	expect(
		(await generateExampleSentences('odcinek', 'beginner', undefined, POLISH)).length
	).toBeGreaterThan(0);
});

test.only('simplify sentences', async ({}) => {
	const res = await simplifySentences(
		[
			{ sentence: 'Nowy odcinek serialu będzie emitowany w piątek o 20:00.', hard: ['emitowany'] },
			{
				sentence: 'Czy mógłbyś mi pokazać, na którym odcinku drogi się zgubiłeś?',
				hard: ['zgubiłes']
			},
			{ sentence: 'Na tym odcinku rzeki często można spotkać wędkarzy.', hard: ['wędkarzy'] },
			{ sentence: 'Proszę podpisać odcinek wypłaty i oddać go do kadr.', hard: ['kadr'] }
		],
		'odcinek',
		POLISH
	);

	console.log(JSON.stringify(res, null, 2));
});
