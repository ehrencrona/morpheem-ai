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
		
		ils ont une télé dorée 
		
		becomes
		
		ils (ils) ont (avoir) une (un) télé (télé) dorée (doré)`,
		es: `cómo va el trabajo
		
		becomes
		
		cómo (cómo) va (ir) el (el) trabajo (trabajo)
		
		dáme un beso
		
		becomes 
		
		dáme (dar) un (uno) beso (beso)
		
		(treat un/una as "uno", la as "el", al as "a", del as "de", me as "me")`
	};

	const response = await ask({
		model: 'gpt-4o',
		messages: (
			[
				{
					role: 'system',
					content: `For every ${language.name} word entered, print it followed by the dictionary form. For any words that are not ${language.name}, use the word itself as the dictionary form. Print nothing else.
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

	const lines = (response || '').split('\n');

	let error: string | undefined = undefined;

	const result = await Promise.all(
		sentences.map(async (sentence, i) => {
			let lemmas: { word: string; lemma: string }[] = [];

			const line = lines[i] || '';
			let matches = line.matchAll(/([^\s]+) \(([^\)]+)\)/g);

			for (let match of matches) {
				let [, word, lemma] = match;

				word = standardize(word);
				lemma = standardize(lemma);

				lemmas.push({ word, lemma });
			}

			return Promise.all(
				toWords(sentence, language).map(async (word, i) => {
					const standardized = standardize(word);

					let lemma: { word: string; lemma: string } | undefined = lemmas[i];

					if (!lemma || lemma.word != standardized) {
						console.warn(
							`There's a mismatch between the word "${word}" and the lemma "${lemmas[i]?.word}" in sentence "${sentence}". Got ${lemmas.map((l) => l.word).join(', ')}`
						);

						lemma = lemmas.find((l) => l.word == standardized)!;
					}

					if (lemma) {
						return lemma.lemma;
					} else {
						const lemmas = await getLemmasOfWord(standardized, language);

						if (lemmas.length == 1) {
							return lemmas[0].word;
						} else {
							error = `No lemma found for "${word}" in sentence "${sentence}", only for ${lemmas.map((l) => l.word).join(', ')}`;

							return standardized;
						}
					}
				})
			);
		})
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
