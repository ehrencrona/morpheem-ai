import { lemmatizeSentences as lemmatizeSentencesAi } from '../ai/lemmatize';
import { getLemmasOfWord } from '../db/lemmas';
import { toWords } from './toWords';
import { Language } from './types';

export async function lemmatizeSentences(
	sentences: string[],
	{ language, ignoreErrors = false }: { language: Language; ignoreErrors?: boolean }
) {
	const lemmas = await Promise.all(
		sentences.map(async (sentence) => {
			const wordStrings = toWords(sentence, language);

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

	const missingLemmas = await lemmatizeSentencesAi(missingSentences, { language, ignoreErrors });

	let i = 0;

	return lemmas.map((lemma) => lemma ?? missingLemmas[i++]);
}
