import { evaluateCloze as evaluateClozeAi } from '../ai/evaluateCloze';
import { getLemmasOfWord } from '../db/lemmas';
import * as DB from '../db/types';
import { getWordByLemma } from '../db/words';
import { addWord } from './addWord';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { toWordStrings } from './toWordStrings';
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
		hint: string;
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
		const quickLemmas = await getLemmasOfWord(answered, language);

		if (quickLemmas.length == 1) {
			alternateWord = {
				...quickLemmas[0],
				conjugated: answered
			};
		} else {
			const sentence = cloze.replace(/_+/, answered);

			const words = toWordStrings(sentence, language);
			const lemmatized = await lemmatizeSentences([sentence], { language, onError: 'useword' });

			const wordIndex = words.findIndex((word) => word === answered);

			if (wordIndex >= 0) {
				const lemma = lemmatized[0][wordIndex];

				try {
					alternateWord = {
						...(await getWordByLemma(lemma, language)),
						conjugated: answered
					};

					console.log(
						`User answer "${answered}" is lemma "${alternateWord.word}" (${alternateWord.id}).`
					);
				} catch (e) {
					console.log(`User answer "${answered}" is a valid alternative, unknown word. Adding it.`);

					try {
						await addWord(answered, {
							language,
							lemma,
							retriesLeft: 0
						});
					} catch (e) {
						console.error(`Error adding different "${answered}" word by lemma "${lemma}":`, e);
					}
				}
			} else {
				console.error(
					`Word "${answered}" not found in sentence "${sentence}" generated from cloze ${cloze}.`
				);
			}
		}
	}

	return { outcome, evaluation, alternateWord, answered };
}
