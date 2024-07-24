import { evaluateWrite, evaluateWriteFromAiOutput } from './evaluateWrite';
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
				entered: `Trzeba myć ząb każdego dnia.`,
				word: `ząb`,
				english: 'tooth'
			},
			{ language: POLISH }
		);

		expect(feedback.userExercises).toMatchObject([
			{
				wordId: expect.any(Number),
				exercise: 'cloze-inflection',
				word: `ząb`,
				isKnown: false
			}
		]);
	});

	test('handles a typo', async () => {
		const feedback = await evaluateWrite(
			{
				exercise: 'write',
				entered: `Oni znaleźli swoje dzietsi.`,
				word: 'oni',
				english: 'they'
			},
			{ language: POLISH }
		);

		expect(feedback.userExercises).toMatchObject([]);
	});

	test('handles two non-typo corrections', async () => {
		const fromAi = {
			correctedParts: [
				{
					correction: 'nie wiedzieli',
					userWrote: 'aby nie wiedzieli',
					english: "so that they didn't know",
					severity: 2
				},
				{
					correction: 'gdzie są ich',
					userWrote: 'gdzie swoj',
					english: 'where their',
					severity: 1
				},
				{
					correction: 'przyjaciele',
					userWrote: 'przyjaciele',
					severity: 0
				}
			],
			correctedSentence: 'Oni znaleźli swoje dzieci, aby nie wiedzieli, gdzie są ich przyjaciele.',
			feedback:
				'Your sentence has some grammatical issues and could use some corrections for clarity and proper usage. Here is the corrected version and the list of corrections applied.'
		};

		const feedback = await evaluateWriteFromAiOutput({
			opts: {
				exercise: 'write',
				entered: `Oni znaleźli swoje dzieci, aby nie wiedzieli, gdzie swoj przyjaciele.`,
				word: 'oni',
				english: 'they'
			},
			...fromAi,
			language: POLISH
		});

		expect(feedback.userExercises).toMatchObject([
			{
				id: null,
				sentenceId: -1,
				phrase: 'nie wiedzieli',
				exercise: 'phrase-cloze',
				hint: "so that they didn't know",
				level: 20,
				isKnown: false,
				severity: 2
			},
			{
				id: null,
				sentenceId: -1,
				phrase: 'gdzie są ich',
				exercise: 'phrase-cloze',
				hint: 'where their',
				level: 20,
				isKnown: false,
				severity: 2
			}
		]);
	});

	test('handles eliminating overlapping corrections', async () => {
		const fromAi = {
			correctedParts: [
				{
					correction: 'są',
					english: 'are',
					severity: 2
				},
				{
					correction: 'gdzie są ich',
					userWrote: 'gdzie swoj',
					english: 'where their',
					severity: 2
				}
			],
			correctedSentence: 'Oni znaleźli swoje dzieci, aby nie wiedzieli, gdzie są ich przyjaciele.',
			feedback:
				'Your sentence has some grammatical issues and could use some corrections for clarity and proper usage. Here is the corrected version and the list of corrections applied.'
		};

		const feedback = await evaluateWriteFromAiOutput({
			opts: {
				exercise: 'write',
				entered: `Oni znaleźli swoje dzieci, aby nie wiedzieli, gdzie swoj przyjaciele.`,
				word: 'oni',
				english: 'they'
			},
			...fromAi,
			language: POLISH
		});

		expect(feedback.userExercises).toMatchObject([
			{
				id: null,
				sentenceId: -1,
				phrase: 'gdzie są ich',
				exercise: 'phrase-cloze',
				hint: 'where their',
				level: 20,
				isKnown: false,
				severity: 2
			}
		]);
	});

	test('handles an unknown word', async () => {
		const fromAi = {
			correctedParts: [
				{
					correction: 'nauczyciela',
					userWrote: 'tichera',
					english: 'teacher',
					severity: 2
				}
			],
			correctedSentence: 'Czy znasz dobrego nauczyciela języka angielskiego?',
			feedback:
				"Good effort! You made a few mistakes. In Polish, the word 'ticher' should be replaced with 'nauczyciel', which is the correct term for 'teacher'. You also need to use the full form 'języka angielskiego' for 'English language'. Here's the corrected sentence."
		};

		const feedback = await evaluateWriteFromAiOutput({
			opts: {
				exercise: 'translate',
				entered: `Czy znasz dobrego tichera angielskiego?`,
				correct: `Czy znasz dobrego nauczyciela języka angielskiego?`,
				english: 'Do you know a good English teacher?',
				revealedClauses: []
			},
			...fromAi,
			language: POLISH
		});

		expect(feedback.userExercises).toMatchObject([
			{
				wordId: expect.any(Number),
				exercise: 'cloze',
				word: 'nauczyciel',
				isKnown: false
			}
		]);
	});
});
