import { lemmatizeSentences as lemmatizeSentencesAi } from '../ai/lemmatize';
import { getLemmasOfWords } from '../db/lemmas';
import { toWordStrings } from './toWordStrings';
import { Language } from './types';

export async function lemmatizeSentences(
	sentences: string[],
	{
		language,
		ignoreErrors = false,
		temperature
	}: { language: Language; ignoreErrors?: boolean; temperature?: number }
) {
	const lemmas = await Promise.all(
		sentences.map(async (sentence) => {
			const wordStrings = toWordStrings(sentence, language);

			if (wordStrings.length == 0) {
				return [];
			}

			const allLemmas = await getLemmasOfWords(wordStrings, language);

			const lemmas = wordStrings.map((wordString, i) => {
				const lemmas = allLemmas[i];

				if (lemmas.length > 1) {
					console.warn(
						`Ambiguous lemmas for ${wordString}: ${lemmas.map(({ word }) => word).join(' / ')}`
					);
				} else if (lemmas.length == 1) {
					return lemmas[0].word;
				}
			});

			if (lemmas.includes(undefined)) {
				return undefined;
			} else {
				return lemmas as string[];
			}
		})
	);

	const missingSentences = sentences.filter((_, i) => lemmas[i] === undefined);

	const missingLemmas = await lemmatizeSentencesAi(missingSentences, {
		language,
		ignoreErrors,
		temperature
	});

	if (missingLemmas.length != missingSentences.length) {
		throw new Error(
			`Unexpected number of lemmas: ${missingLemmas.length} vs ${missingSentences.length}`
		);
	}

	let i = 0;

	return lemmas.map((lemma) => (lemma != undefined ? lemma : missingLemmas[i++]));
}
