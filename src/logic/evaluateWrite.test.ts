import { evaluateWrite } from './evaluateWrite';
import { POLISH } from '../constants';
import { describe, expect, test } from 'vitest';

// On ume igrać na gitare. -> On potrafi grać na gitarze.

// Ja nie potrafię prowadzić samochodu. -> Ja nie potrafię prowadzić samochodu.

// Ja kupił ej bilety na koncert który chodziła oglądać na swoje urodzine. -> Na urodziny kupiłem jej bilety na koncert, który chciała obejrzeć.

// Ja uczyłem na test historii jutro. -> Nauczyłem się do testu z historii na jutro.

// Delikatnie kwiaty są piękny w ogrodze. -> Delikatne kwiaty są piękne w ogrodzie.

describe('evaluateWrite', async () => {
	test('handles single inflection wrong', async () => {
		const feedback = await evaluateWrite(
			{
				exercise: 'write',
				entered: `Trzeba myć zęb każdego dnia.`,
				word: `ząb`
			},
			{ language: POLISH, userId: 4711 }
		);

		expect(
			feedback.knowledge.reduce((words, k) => ({ ...words, [k.word.word]: k.isKnown }), {})
		).toMatchObject({
			ząb: true,
			myć: true,
			każdy: true,
			dzień: true
		});

		expect(feedback.userExercises).toMatchObject([
			{
				wordId: expect.any(Number),
				exercise: 'cloze-inflection',
				isKnown: false
			},
			{
				exercise: 'translate',
				isKnown: true
			}
		]);
	});

	test('handles single word wrong', async () => {
		const feedback = await evaluateWrite(
			{
				exercise: 'write',
				entered: `Oni znaleźli swoje dzietsi.`,
				word: 'oni'
			},
			{ language: POLISH, userId: 4711 }
		);

		expect(feedback.userExercises).toMatchObject([
			{
				wordId: expect.any(Number),
				exercise: 'cloze',
				isKnown: false
			},
			{
				exercise: 'translate',
				isKnown: true
			}
		]);
	});

	test('handles a major mess', async () => {
		const feedback = await evaluateWrite(
			{
				exercise: 'write',
				entered: `Oni znaleźli swoje dzieci, aby nie wiedzieli, gdzie swoj przyjaciele.`,
				word: 'oni'
			},
			{ language: POLISH, userId: 4711 }
		);

		expect(feedback.userExercises).toMatchObject([
			{
				exercise: 'translate',
				isKnown: false
			}
		]);
	});

	test('handles an unknown word', async () => {
		const feedback = await evaluateWrite(
			{
				exercise: 'translate',
				entered: `Czy znasz dobrego tichera angielskiego?`,
				correct: `Czy znasz dobrego nauczyciela angielskiego?`,
				english: `Do you know a good English teacher?`
			},
			{ language: POLISH, userId: 1234 }
		);

		expect(feedback.userExercises).toMatchObject([
			{
				wordId: expect.any(Number),
				exercise: 'cloze',
				word: 'nauczyciel',
				isKnown: false
			},
			{
				exercise: 'translate',
				word: null,
				isKnown: true
			}
		]);

		expect(feedback.unknownWords).toMatchObject([
			{
				word: 'nauczyciel'
			}
		]);

		expect(feedback.knowledge.find((k) => k.word.word === 'nauczyciel')).toMatchObject({
			isKnown: false
		});
	});
});
