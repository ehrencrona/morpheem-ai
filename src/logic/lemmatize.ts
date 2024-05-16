import { getLemmasOfWord } from '../db/lemmas';
import { toWords } from './toWords';
import { lemmatizeSentences as lemmatizeSentencesAi } from '../ai/lemmatize';

export async function lemmatizeSentences(
	sentences: string[],
	{ retriesLeft = 1 }: { retriesLeft?: number } = {}
) {
	const lemmas = await Promise.all(
		sentences.map(async (sentence) => {
			const wordStrings = toWords(sentence);

			const lemmas = await Promise.all(
				wordStrings.map(async (wordString) => {
					const lemmas = await getLemmasOfWord(wordString);

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

	const missingLemmas = await lemmatizeSentencesAi(missingSentences);

	let i = 0;

	return lemmas.map((lemma, i) => lemma ?? missingLemmas[i++]);
}
