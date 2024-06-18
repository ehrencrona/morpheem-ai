import { evaluateCloze as evaluateClozeAi } from '../ai/evaluateCloze';
import { getWordByLemma } from '../db/words';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { toWords } from './toWords';
import { Language } from './types';
import * as DB from '../db/types';
import { getLemmaIdsOfWord } from '../db/lemmas';

export async function evaluateCloze(
	opts: {
		cloze: string;
		clue: string;
		userAnswer: string;
		correctAnswer: { conjugated: string; id: number };
		isWrongInflection: boolean;
	},
	{
		language
	}: {
		language: Language;
	}
) {
	let {
		corrected,
		isPossibleWord,
		isCorrectInflection,
		shortEvaluation: evaluation
	} = await evaluateClozeAi(opts, {
		language
	});

	const { correctAnswer, cloze } = opts;

	let differentWord: (DB.Word & { conjugated: string }) | undefined;

	if (corrected && corrected !== opts.userAnswer) {
		console.log(
			`Cloze "${cloze}" evaluated "${opts.userAnswer}" as typo, fixed to "${corrected}".`
		);
	}

	let userAnswer = standardize(corrected || opts.userAnswer);
	let isCorrectLemma = false;
	let isTypo = userAnswer != standardize(opts.userAnswer) && !!isCorrectInflection;

	if (isPossibleWord && standardize(correctAnswer.conjugated) != userAnswer) {
		console.log(
			`Cloze "${cloze}" evaluated "${userAnswer}" as possible, standardized to "${userAnswer}".`
		);

		const sentence = cloze.replace(/_+/, userAnswer);

		const words = toWords(sentence, language);
		const lemmatized = await lemmatizeSentences([sentence], { language, ignoreErrors: true });

		const wordIndex = words.findIndex((word) => word === userAnswer);

		isCorrectLemma = true;
		isCorrectInflection = !opts.isWrongInflection;

		if (wordIndex >= 0) {
			const differentWordString = lemmatized[0][wordIndex];

			try {
				differentWord = {
					...(await getWordByLemma(differentWordString, language)),
					conjugated: userAnswer
				};

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
	} else {
		const lemmaIds = await getLemmaIdsOfWord(userAnswer, language);

		isCorrectLemma = lemmaIds.some((l) => l.lemma_id == correctAnswer.id);
		isCorrectInflection = standardize(correctAnswer.conjugated) == userAnswer;
	}

	return { evaluation, isCorrectInflection, isCorrectLemma, isTypo, differentWord };
}
