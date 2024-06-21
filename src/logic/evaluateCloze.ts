import { evaluateCloze as evaluateClozeAi } from '../ai/evaluateCloze';
import * as DB from '../db/types';
import { getWordByLemma } from '../db/words';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { Language } from './types';

export async function evaluateCloze(
	opts: {
		cloze: string;
		clue: string;
		userAnswer: string;
		correctAnswer: { conjugated: string; word: string; id: number };
		isRightLemma: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
) {
	let {
		case: outcome,
		evaluation,
		corrected
	} = await evaluateClozeAi(opts, {
		language
	});

	const { cloze } = opts;

	let alternateWord: (DB.Word & { conjugated: string }) | undefined;

	console.log(
		`Cloze "${cloze}" evaluated "${opts.userAnswer}" as ${outcome}${corrected ? `, fixed to "${corrected}".` : ''}`
	);

	let userAnswer = standardize(corrected || opts.userAnswer);

	if (outcome == 'alternate' || outcome == 'alternateWrongForm') {
		const sentence = cloze.replace(/_+/, userAnswer);

		const words = toWords(sentence, language);
		const lemmatized = await lemmatizeSentences([sentence], { language, ignoreErrors: true });

		const wordIndex = words.findIndex((word) => word === userAnswer);

		if (wordIndex >= 0) {
			const differentWordString = lemmatized[0][wordIndex];

			try {
				alternateWord = {
					...(await getWordByLemma(differentWordString, language)),
					conjugated: userAnswer
				};

				console.log(
					`User answer "${userAnswer}" is lemma "${alternateWord.word}" (${alternateWord.id}).`
				);
			} catch (e) {
				// add the word?

				console.error(
					`Error getting different "${differentWordString}" word by lemma "${lemmatized[0][wordIndex]}":`,
					e
				);
			}
		} else {
			console.error(`Word "${userAnswer}" not found in sentence "${sentence}".`);
		}
	}

	return { outcome, evaluation, alternateWord };
}
