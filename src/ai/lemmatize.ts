import { CodedError } from '../CodedError';
import { getLemmasOfWord } from '../db/lemmas';
import { standardize } from '../logic/isomorphic/standardize';
import { toWords } from '../logic/toWords';
import type { Language, LanguageCode } from '../logic/types';
import { Message, ask } from './ask';

export async function lemmatizeSentences(
	sentences: string[],
	{
		language,
		ignoreErrors,
		retriesLeft = 1,
		temperature = 0
	}: { language: Language; retriesLeft?: number; ignoreErrors?: boolean; temperature?: number }
): Promise<string[][]> {
	if (sentences.length === 0) {
		return [];
	}

	// split up sentences into batches of no more than 150 characters
	const batches: string[][] = [];

	let currentBatch: string[] = [];
	let currentBatchLength = 0;

	for (const sentence of sentences) {
		if (currentBatchLength + sentence.length > 300 && currentBatch.length > 0) {
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
				return await lemmatizeBatch(batch, { language, ignoreErrors, retriesLeft, temperature });
			})
		)
	).reduce<string[][]>((acc, val) => acc.concat(val), []);
}

async function lemmatizeBatch(
	sentences: string[],
	{
		language,
		ignoreErrors,
		retriesLeft = 1,
		temperature = 0
	}: { language: Language; retriesLeft?: number; ignoreErrors?: boolean; temperature?: number }
): Promise<string[][]> {
	if (sentences.length === 0) {
		return [];
	}

	const examples: Record<LanguageCode, string> = {
		pl: `“Byłoby dobrze, gdybyś był gorszym przykładem.”

		becomes 
		
		byłoby (być) dobrze (dobrze), gdybyś (gdyby) był (być) gorszym (zły) przykładem (przykład)
		
		niesamowicie cię kocham
		
		becomes
		
		niesamowicie (niesamowicie) cię (ty) kocham (kochać)`,
		fr: `"y a-t-il des chaises"
		
		becomes

		y (y) a-t-il (avoir) des (de) chaises (chaise)
		
		qu' est-ce que c' est
		
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

		irse al parque

		becomes

		irse (ir) al (a) parque (parque)
		
		(treat un/una as "uno", la as "el", al as "a", del as "de", me as "me")`,
		ko: `우리는 결과를 예상했습니다 becomes 우리는 (우리) 결과를 (결과) 예상했습니다 (예상하다)
서연아 비 때문에 늦었어요 becomes 서연아 (서연) 비 (비) 때문에 (때문에) 늦었어요 (늦다)
언제부터 공부했어요 becomes 언제부터 (언제부터) 공부했어요 (공부하다)
긴 becomes 긴 (길다)
가지 마세요 becomes 가지 (가다) 마세요 (마세요)
물 주세요 becomes 물 (물) 주세요 (주다)
케이크이다 becomes 케이크이다 (케이크)
서연이네 becomes 서연이네 (서연)`,
		nl: `komt anna's man mee

becomes

komt (komen) anna's (anna) man (man) mee (met)

je bent de ergste

becomes

je (jij) bent (zijn) de (de) ergste (erg)

het zijn onze boekjes

becomes

het (het) zijn (zijn) onze (ons) boekjes (boek)
		`,
		ru: `как дела?

becomes

как (как) дела (дело)`
	};

	const response = await ask({
		model: 'gpt-4o',
		messages: (
			[
				{
					role: 'system',
					content: `For every ${language.name} word entered, print it followed by the dictionary form. For any words that are not ${language.name}${
						language.code == 'ko' ? ' or that are particles' : ''
					}, use the word itself as the dictionary form. Print nothing else.
					Example:

${examples[language.code]}`
				}
			] as Message[]
		).concat({
			role: 'user',
			content: sentences.map((sentence) => toWords(sentence, language).join(' ')).join('\n')
		}),
		temperature,
		max_tokens: 1000,
		logResponse: true
	});

	const lines = (response || '').split('\n');

	const lemmasByLine: { word: string; lemma: string }[][] = [];

	lines.forEach((line, i) => {
		let matches = line.matchAll(/([^\s]+) \(([^\)]+)\)/g);
		let lemmas: { word: string; lemma: string }[] = [];

		for (let match of matches) {
			let [, word, lemma] = match;

			word = standardize(word);
			lemma = standardize(lemma);

			lemmas.push({ word, lemma });
		}

		lemmasByLine.push(lemmas);
	});

	let error: string | undefined = undefined;

	const result = await Promise.all(
		sentences.map(async (sentence, i) => {
			let lemmas = lemmasByLine[i] || [];

			return Promise.all(
				toWords(sentence, language).map(async (word, i) => {
					const standardized = standardize(word);

					let lemma: { word: string; lemma: string } | undefined = lemmas[i];

					if (!lemma || lemma.word != standardized) {
						console.warn(
							`There's a mismatch between the word "${word}" and the lemma "${lemmas[i]?.word}" in sentence "${sentence}". Got ${lemmas.map((l) => l.word).join(', ')}`
						);

						lemma = lemmas.find((l) => l.word == standardized)!;

						if (!lemma) {
							lemma = lemmasByLine.flat().find((l) => l.word == standardized);

							if (lemma) {
								console.warn(`Managed to find the lemma elsewhere.`);
							}
						}
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
