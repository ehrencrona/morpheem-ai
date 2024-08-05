import { CodedError } from '../CodedError';
import { classifyLemmas } from '../ai/classifyLemmas';
import { addWordToLemma } from '../db/lemmas';
import { WordType } from '../db/types';
import * as words from '../db/words';
import { getWordByLemma } from '../db/words';
import { standardize } from './isomorphic/standardize';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';

export async function addWord(
	wordString: string,
	{
		language,
		temperature,
		lemma
	}: { language: Language; retriesLeft?: number; temperature?: number; lemma?: string }
) {
	if (!lemma) {
		[[lemma]] = await lemmatizeSentences([wordString], { language, temperature });

		if (!lemma) {
			throw new Error(`Could not lemmatize word to be added "${wordString}"`);
		}
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
				console.log(`Lemma "${lemma}" of word "${wordString}" is classified as "${type}".`);
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
