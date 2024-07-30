import { CodedError } from '../CodedError';
import { classifyLemmas } from '../ai/classifyLemmas';
import { getWordByLemma } from '../db/words';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';
import * as words from '../db/words';
import { WordType } from '../db/types';
import { addWordToLemma } from '../db/lemmas';
import { standardize } from './isomorphic/standardize';

export async function addWord(
	wordString: string,
	{
		language,
		retriesLeft = 1,
		temperature,
		lemma
	}: { language: Language; retriesLeft?: number; temperature?: number; lemma?: string }
) {
	if (!lemma) {
		[[lemma]] = await lemmatizeSentences([wordString], { language, temperature });
	}

	wordString = standardize(wordString);

	try {
		const word = await getWordByLemma(lemma, language);

		await addWordToLemma(wordString, word, language);

		return word;
	} catch (e) {
		if ((e as CodedError).code == 'noSuchWord') {
			const { type } = (await classifyLemmas([lemma], { language, throwOnInvalid: false }))[0];

			if (type == 'inflection' || type == 'wrong') {
				console.log(
					`Lemma "${lemma}" of word "${wordString}" is classified as "${type}".` +
						(retriesLeft ? ' Retrying...' : '')
				);

				if (retriesLeft) {
					return addWord(wordString, { language, retriesLeft: retriesLeft - 1, temperature: 1 });
				} else {
				}
			}

			const word = await words.addWord(lemma, {
				type: (type as WordType) || undefined || null,
				language
			});

			await addWordToLemma(wordString, word, language);

			return word;
		} else {
			throw e;
		}
	}
}
