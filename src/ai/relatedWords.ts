import { z } from 'zod';
import { Language, LanguageCode } from '../logic/types';
import { askForJson } from './askForJson';

const examples: Record<LanguageCode, string> = {
	es: `enojar: enojado. multinacional: nacional, nacionalista. Maldado is too distant from malo.`,
	sv: `flygplan: flyga, flyg. befolkning: folk. riktning: rikta. Rödaktig is too distant from röd. Vara is too distant from vara.`,
	fr: `développer: développement, développé. Bientôt is too distant from tôt.`,
	pl: `angażować: zaangażować, zaangażowanie, zaangażowany. zatrudnienie: trudno, trudność, trudny.`,
	ru: `водопровод: вода, водный, провод, проводник, проводка, проводить, провести. быстро: быстрый, быстрота.`,
	ko: `프로그래밍: 프로그램, 프로그래머.`,
	nl: `ontwikkelen: ontwikkeling, ontwikkelaar.`
};

export async function findRelatedWords(lemma: string, language: Language) {
	return (
		await askForJson({
			messages: [
				{
					role: 'user',
					content: `Give me other ${language.name} dictionary words that have (only) the same root as "${lemma}". Example: ${examples[language.code]} Only dictionary terms, no inflections.

There might be none. If in doubt, exclude the word. Output only the list of words as a JSON in the form { words: string[] }.`
				}
			],
			schema: z.object({
				words: z.array(z.string())
			}),
			model: 'claude-3-5-sonnet-20240620',
			temperature: 0.5,
			logResponse: true
		})
	).words.filter((word) => word !== lemma);
}

export async function findRelatedWordsForMany(lemmas: string[], language: Language) {
	return (
		await askForJson({
			messages: [
				{
					role: 'user',
					content: `Give me other ${language.name} dictionary words that have (only) the same root as the following words. Example: ${examples[language.code]} Only dictionary terms, no inflections.

There might be none. If in doubt, exclude the word. Output only the list of words as a JSON in the form { words: { word: string, sameRoot: string[] }[] }.

Words: ${lemmas.join(', ')}`
				}
			],
			schema: z.object({
				words: z.array(
					z.object({
						word: z.string(),
						sameRoot: z.array(z.string())
					})
				)
			}),
			model: 'claude-3-5-sonnet-20240620',
			temperature: 0.5,
			logResponse: true
		})
	).words;
}
