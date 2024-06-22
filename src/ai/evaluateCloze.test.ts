import { describe, expect, test } from 'vitest';
import { evaluateCloze } from '../logic/evaluateCloze';
import { POLISH } from '../constants';

describe('evaluateCloze', async () => {
	const cloze = {
		cloze: `Znalezienie _____ jest bardzo trudne.`,
		clue: 'Relation/relationship',
		correctAnswer: { conjugated: 'relacji', word: 'relacja', id: 123 }
	};

	test('handles wrongForm', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				userAnswer: 'relacje',
				isRightLemma: true
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('wrongForm');
		// correct form
		expect(evaluation.evaluation).toContain('genitive');
		// my form
		expect(evaluation.evaluation).toContain('plural');
	});

	test('handles plain wrong', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				userAnswer: 'relato',
				isRightLemma: false
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('wrong');
	});

	test('handles typo', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				userAnswer: 'relazji',
				isRightLemma: false
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('typo');
	});

	test('handles alternate', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				userAnswer: 'związku',
				isRightLemma: false
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('alternate');

		expect(evaluation.alternateWord?.word).toEqual('związek');
	});

	test('handles alternateWrongForm', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				userAnswer: 'związek',
				isRightLemma: false
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('alternateWrongForm');

		// correct form
		expect(evaluation.evaluation).toContain('genitive');
		// my form
		expect(evaluation.evaluation).toContain('nominative');

		expect(evaluation.alternateWord?.word).toEqual('związek');
		expect(evaluation.alternateWord?.conjugated).toEqual('związku');
	});

	test('handles im/perfective', async () => {
		const evaluation = await evaluateCloze(
			{
				cloze: `Marek ____ się nowej umiejętności programowania w Pythonie.`,
				clue: 'learned',
				correctAnswer: { conjugated: 'nauczył', word: `nauczyć`, id: 1234 },
				isRightLemma: false,
				userAnswer: 'uczył'
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('wrongForm');
		expect(evaluation.evaluation).toContain('perfective');
		expect(evaluation.evaluation).toContain('imperfective');
	});
});