import { evaluateCloze as evaluateClozeAi } from '../ai/evaluateCloze';
import { getWordByLemma } from '../db/words';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { Language } from './types';
import * as DB from '../db/types';

export async function evaluateCloze(
	opts: {
		cloze: string;
		clue: string;
		userAnswer: string;
		correctAnswer: string;
		isWrongInflection: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
) {
	const evaluation = await evaluateClozeAi(opts, { language });

	const { correctAnswer, userAnswer, cloze } = opts;

	let differentWord: DB.Word | undefined;

	if (evaluation.isPossible && standardize(correctAnswer) != standardize(userAnswer)) {
		console.log(`Cloze "${cloze}" evaluated as possible "${userAnswer}".`);

		const sentence = cloze.replace(/_+/, userAnswer);

		const words = toWords(sentence, language);
		const lemmatized = await lemmatizeSentences([sentence], { language, ignoreErrors: true });

		const wordIndex = words.findIndex((word) => word === standardize(userAnswer));

		if (wordIndex >= 0) {
			const differentWordString = lemmatized[0][wordIndex];

			try {
				differentWord = await getWordByLemma(differentWordString, language);

				console.log(
					`User answer "${userAnswer}" is lemma "${differentWord.word}" (${differentWord.id}).`
				);
			} catch (e) {
				console.error(
					`Error getting different "${differentWordString}" word by lemma "${lemmatized[0][wordIndex]}":`,
					e
				);
			}
		} else {
			console.error(`Word "${userAnswer}" not found in sentence "${sentence}".`);
		}
	}

	return { ...evaluation, differentWord };
}
