import { describe, expect, test } from 'vitest';
import { evaluateCloze } from '../logic/evaluateCloze';
import { POLISH } from '../constants';

describe('evaluateCloze', async () => {
	const cloze = {
		cloze: `Znalezienie _____ jest bardzo trudne.`,
		hint: 'Relation/relationship',
		correctAnswer: { conjugated: 'relacji', word: 'relacja', id: 123 }
	};

	test('handles wrongForm', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				answered: 'relacje',
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
				answered: 'relato',
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
				answered: 'relazji',
				isRightLemma: false
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('typo');
	});

	test('handles implied gender', async () => {
		const cloze = {
			cloze: `Powiedziała, żebym ______ wcześniej spać`,
			hint: 'go',
			correctAnswer: { conjugated: 'poszedł', word: 'pójść', id: 123 }
		};

		const evaluation = await evaluateCloze(
			{
				...cloze,
				answered: 'poszła',
				isRightLemma: false
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('alternate');
	});

	test('handles alternate', async () => {
		const evaluation = await evaluateCloze(
			{
				...cloze,
				answered: 'związku',
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
				answered: 'związek',
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
				hint: 'learned',
				correctAnswer: { conjugated: 'nauczył', word: `nauczyć`, id: 1234 },
				isRightLemma: false,
				answered: 'uczył'
			},
			{ language: POLISH }
		);

		expect(evaluation.outcome).toEqual('wrongForm');
		expect(evaluation.evaluation).toContain('perfective');
		expect(evaluation.evaluation).toContain('imperfective');
	});
});
