import { CodedError } from '../CodedError';
import { getLemmasOfWord } from '../db/lemmas';
import { standardize } from '../logic/isomorphic/standardize';
import { toWords } from '../logic/toWords';
import { Language } from '../logic/types';
import { Message, ask } from './ask';

export async function lemmatizeSentences(
	sentences: string[],
	{
		language,
		ignoreErrors,
		retriesLeft = 1
	}: { language: Language; retriesLeft?: number; ignoreErrors?: boolean }
): Promise<string[][]> {
	if (sentences.length === 0) {
		return [];
	}

	// split up sentences into batches of no more than 150 characters
	const batches: string[][] = [];

	let currentBatch: string[] = [];
	let currentBatchLength = 0;

	for (const sentence of sentences) {
		if (currentBatchLength + sentence.length > 150 && currentBatch.length > 0) {
			batches.push(currentBatch);
			currentBatch = [];
			currentBatchLength = 0;
		}

		currentBatch.push(sentence);
		currentBatchLength += sentence.length;
	}

	batches.push(currentBatch);

	return (
		await Promise.all(
			batches.map(async (batch) => {
				return await lemmatizeBatch(batch, { language, ignoreErrors, retriesLeft });
			})
		)
	).reduce<string[][]>((acc, val) => acc.concat(val), []);
}

async function lemmatizeBatch(
	sentences: string[],
	{
		language,
		ignoreErrors,
		retriesLeft = 1
	}: { language: Language; retriesLeft?: number; ignoreErrors?: boolean }
): Promise<string[][]> {
	if (sentences.length === 0) {
		return [];
	}

	const examples = {
		pl: `"to są przykłady" 

		becomes 
							
		to (to) są (być) przykłady (przykład)`,
		fr: `"y a-t-il des chaises?"
		
		becomes

		y (y) a-t-il (avoir) des (de) chaises (chaise)
		
		qu' est-ce que c' est?
		
		becomes
		
		qu' (que) est-ce (être) que (que) c' (ce) est (être)
		
		ils ouvrent
		
		becomes
		
		ils (ils) ouvrent (ouvrir)`
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
			content: sentences.map((sentence) => toWords(sentence, language).join(' ')).join('\n')
		}),
		temperature: 0,
		max_tokens: 1000,
		logResponse: true
	});

	let lemmaByWord: Record<string, string> = {};

	(response || '').split('\n').map((line) => {
		let matches = line.matchAll(/([^\s]+) \(([^\s]+)\)/g);

		for (let match of matches) {
			let [, word, lemma] = match;

			word = standardize(word);
			lemma = standardize(lemma);

			lemmaByWord[word] = lemma;
		}
	});

	let error: string | undefined = undefined;

	const result = await Promise.all(
		sentences.map(async (sentence) =>
			Promise.all(
				toWords(sentence, language).map(async (word) => {
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

	if (error && !ignoreErrors) {
		if (retriesLeft > 0) {
			return lemmatizeBatch(sentences, {
				language,
				retriesLeft: retriesLeft - 1,
				ignoreErrors
			});
		} else {
			throw new CodedError(error, 'noLemmaFound');
		}
	}

	return result;
}
