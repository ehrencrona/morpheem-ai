import { evaluateCloze as evaluateClozeAi } from '../ai/evaluateCloze';
import * as DB from '../db/types';
import { getWordByLemma } from '../db/words';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { Language } from './types';

export interface Evaluation {
	answered: string;
	outcome: 'correct' | 'wrongForm' | 'typo' | 'alternate' | 'alternateWrongForm' | 'wrong';
	evaluation?: string;
	alternateWord?: DB.Word & { conjugated: string };
}

export async function evaluateCloze(
	opts: {
		cloze: string;
		clue: string;
		answered: string;
		correctAnswer: { conjugated: string; word: string; id: number };
		isRightLemma: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
): Promise<Evaluation> {
	let {
		case: outcome,
		evaluation,
		corrected
	} = await evaluateClozeAi(opts, {
		language
	});

	const { cloze, correctAnswer } = opts;

	let alternateWord: (DB.Word & { conjugated: string }) | undefined;

	console.log(
		`Cloze "${cloze}" evaluated "${opts.answered}" as ${outcome}${corrected ? `, fixed to "${corrected}".` : ''}`
	);

	let answered = standardize(corrected || opts.answered);

	// we did ask because the answer was unexpected, so it can't be correct.
	// therefore, let's say it's alternate.
	if (outcome == 'correct' && corrected != correctAnswer.conjugated) {
		console.warn(
			`Answer "${corrected}" evaluated as correct but it is different from correct answer "${correctAnswer.conjugated}".`
		);

		outcome = 'alternate';
	}

	if (outcome == 'alternate' || outcome == 'alternateWrongForm') {
		const sentence = cloze.replace(/_+/, answered);

		const words = toWords(sentence, language);
		const lemmatized = await lemmatizeSentences([sentence], { language, ignoreErrors: true });

		const wordIndex = words.findIndex((word) => word === answered);

		if (wordIndex >= 0) {
			const differentWordString = lemmatized[0][wordIndex];

			try {
				alternateWord = {
					...(await getWordByLemma(differentWordString, language)),
					conjugated: answered
				};

				console.log(
					`User answer "${answered}" is lemma "${alternateWord.word}" (${alternateWord.id}).`
				);
			} catch (e) {
				// add the word?

				console.error(
					`Error getting different "${differentWordString}" word by lemma "${lemmatized[0][wordIndex]}":`,
					e
				);
			}
		} else {
			console.error(
				`Word "${answered}" not found in sentence "${sentence}" generated from cloze ${cloze}.`
			);
		}
	}

	return { outcome, evaluation, alternateWord, answered };
}
