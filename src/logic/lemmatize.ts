import { lemmatizeSentences as lemmatizeSentencesAi } from '../ai/lemmatize';
import { getLemmasOfWord } from '../db/lemmas';
import { toWords } from './toWords';
import { Language } from './types';

export async function lemmatizeSentences(sentences: string[], language: Language) {
	const lemmas = await Promise.all(
		sentences.map(async (sentence) => {
			const wordStrings = toWords(sentence);

			const lemmas = await Promise.all(
				wordStrings.map(async (wordString) => {
					const lemmas = await getLemmasOfWord(wordString, language);

					if (lemmas.length > 1) {
						console.warn(
							`Ambiguous lemmas for ${wordString}: ${lemmas.map(({ word }) => word).join(' / ')}`
						);
					} else if (lemmas.length == 1) {
						return lemmas[0].word;
					}
				})
			);

			if (lemmas.includes(undefined)) {
				return undefined;
			} else {
				return lemmas as string[];
			}
		})
	);

	const missingSentences = sentences.filter((_, i) => lemmas[i] === undefined);

	const missingLemmas = await lemmatizeSentencesAi(missingSentences, { language });

	let i = 0;

	return lemmas.map((lemma, i) => lemma ?? missingLemmas[i++]);
}
