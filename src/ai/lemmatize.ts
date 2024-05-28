import { CodedError } from '../CodedError';
import { getLemmasOfWord } from '../db/lemmas';
import { standardize } from '../logic/isomorphic/standardize';
import { toWords } from '../logic/toWords';
import { Language } from '../logic/types';
import { Message, ask } from './ask';

export async function lemmatizeSentences(
	sentences: string[],
	{ language, retriesLeft = 1 }: { language: Language; retriesLeft?: number }
) {
	if (sentences.length === 0) {
		return [];
	}

	const examples = {
		pl: `"to są przykłady" 

		becomes 
							
		to: to
		są: być
		przykłady: przykład`,
		fr: `"y a-t-il des chaises?"
		
		becomes

		y: y
		a-t-il: avoir
		des: de
		chaises: chaise
		
		qu'est-ce que c'est?
		
		becomes
		
		qu': que
		est-ce: être
		que: que
		c': ce
		est: être`
	};

	const response = await ask({
		model: 'gpt-4o',
		messages: (
			[
				{
					role: 'system',
					content: `For every ${language.name} word entered, print it followed by the dictionary form. Print nothing else.
					Example:

${examples[language.code]}`
				}
			] as Message[]
		).concat({
			role: 'user',
			content: sentences.map((sentence) => toWords(sentence).join(' ')).join('\n')
		}),
		temperature: 0,
		max_tokens: 1000
	});

	let lemmaByWord: Record<string, string> = {};

	(response || '').split('\n').map((line) => {
		let [word, lemma] = line.split(':').map((part) => part.trim());

		if (word && lemma) {
			word = standardize(word);
			lemma = standardize(lemma);

			lemmaByWord[word] = lemma;
		}
	});

	let error: string | undefined = undefined;

	const result = await Promise.all(
		sentences.map(async (sentence) =>
			Promise.all(
				toWords(sentence).map(async (word) => {
					const standardized = standardize(word);

					if (lemmaByWord[standardized]) {
						return lemmaByWord[standardized];
					} else {
						const lemmas = await getLemmasOfWord(standardized, language);

						if (lemmas.length == 1) {
							return lemmas[0].word;
						} else {
							error = `No lemma found for "${word}" in sentence "${sentence}", only ${Object.keys(lemmaByWord).join(', ')}`;

							return standardized;
						}
					}
				})
			)
		)
	);

	if (error) {
		if (retriesLeft > 0) {
			return lemmatizeSentences(sentences, { language, retriesLeft: retriesLeft - 1 });
		} else {
			throw new CodedError(error, 'noLemmaFound');
		}
	}

	return result;
}
