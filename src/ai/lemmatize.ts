import { CodedError } from '../CodedError';
import { getLemmasOfWord } from '../db/lemmas';
import { standardize } from '../logic/isomorphic/standardize';
import { toWordStrings } from '../logic/toWordStrings';
import type { Language, LanguageCode } from '../logic/types';
import { Message, ask } from './ask';

// these words don't even go to the llm
const forcedLemmas: Record<LanguageCode, Record<string, string>> = {
	sv: {
		// wordString -> lemma
		ett: 'en',
		detta: 'denna',
		mig: 'jag'
	},
	ko: {},
	pl: {
		go: 'on',
		mu: 'on'
	},
	nl: {},
	ru: {
		его: 'он',
		её: 'она',
		дети: 'ребёнок',
		мне: 'я',
		они: 'они',
		их: 'они',
		им: 'они',
		ими: 'они',
		них: 'они',
		ними: 'они',
		со: 'с',
		нужно: 'нужный',
		лучший: 'лучший',
		лучшие: 'лучший'
	},
	es: {
		buen: 'bueno',
		// note that la and las are either an article or a pronoun
		esta: 'este',
		esa: 'ese',
		al: 'a',
		del: 'de',
		un: 'uno',
		una: 'uno',
		la: 'el',
		// indirect object pronoun
		mí: 'mí',
		ti: 'ti',
		sí: 'sí',
		// direct object pronoun
		me: 'me',
		te: 'te',
		le: 'le',
		nos: 'nos',
		os: 'os',
		les: 'les'
	},
	fr: {
		ci: 'ci',
		ça: 'cela',
		vacances: 'vacances'
	}
};

// renames the output of the llm
const renamedLemmas: Record<LanguageCode, Record<string, string>> = {
	ru: {
		все: 'всё',
		ребенок: 'ребёнок'
	},
	sv: {},
	ko: {},
	pl: {},
	nl: {},
	es: {},
	fr: {}
};

export async function lemmatizeSentences(
	sentences: string[],
	{
		language,
		onError,
		retriesLeft = 1,
		temperature = 0
	}: {
		language: Language;
		retriesLeft?: number;
		onError?: 'useword' | 'throw' | 'returnempty';
		temperature?: number;
	}
): Promise<string[][]> {
	if (sentences.length === 0) {
		return [];
	}

	// split up sentences into batches of no more than 500 characters
	const batches: string[][] = [];

	let currentBatch: string[] = [];
	let currentBatchLength = 0;

	for (const sentence of sentences) {
		if (currentBatchLength + sentence.length > 500 && currentBatch.length > 0) {
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
				return await lemmatizeBatch(batch, { language, onError, retriesLeft, temperature });
			})
		)
	).reduce<string[][]>((acc, val) => acc.concat(val), []);
}

async function lemmatizeBatch(
	sentences: string[],
	{
		language,
		onError,
		retriesLeft = 1,
		temperature = 0
	}: {
		language: Language;
		retriesLeft?: number;
		onError?: 'useword' | 'throw' | 'returnempty';
		temperature?: number;
	}
): Promise<string[][]> {
	if (sentences.length === 0) {
		return [];
	}

	const examples: Record<LanguageCode, string> = {
		pl: `Byłoby dobrze, gdybyś był gorszym przykładem

		becomes 
		
		byłoby (być) dobrze (dobrze), gdybyś (gdyby) był (być) gorszym (zły) przykładem (przykład)
		
		Niesamowicie cię kocham
		
		becomes
		
		niesamowicie (niesamowicie) cię (ty) kocham (kochać)
		
		To jest przykład
		
		becomes
		
		to (ten) jest (być) przykład (przykład)`,
		fr: `"Y a-t-il des chaises"
		
		becomes

		Y (y) a-t-il (avoir) des (de) chaises (chaise)
		
		Qu' est-ce que c' est
		
		becomes
		
		Qu' (que) est-ce (être) que (que) c' (ce) est (être)
		
		Ils ont une télé dorée 
		
		becomes
		
		Ils (ils) ont (avoir) une (un) télé (télé) dorée (doré)`,
		es: `Cómo va el trabajo
		
		becomes
		
		Cómo (cómo) va (ir) el (el) trabajo (trabajo)
		
		Dáme un beso
		
		becomes 
		
		Dáme (dar) un (uno) beso (beso)

		Irse al parque

		becomes

		Irse (ir) al (a) parque (parque)
		
		(treat un/una as "uno", all articles - la, las, los - as "el")`,
		ko: `우리는 결과를 예상했습니다 becomes 우리는 (우리) 결과를 (결과) 예상했습니다 (예상하다)
서연아 비 때문에 늦었어요 becomes 서연아 (서연) 비 (비) 때문에 (때문에) 늦었어요 (늦다)
언제부터 공부했어요 becomes 언제부터 (언제부터) 공부했어요 (공부하다)
긴 becomes 긴 (길다)
가지 마세요 becomes 가지 (가다) 마세요 (마세요)
물 주세요 becomes 물 (물) 주세요 (주다)
케이크이다 becomes 케이크이다 (케이크)
서연이네 becomes 서연이네 (서연)`,
		nl: `Komt Anna's man mee

becomes

Komt (komen) Anna's (Anna) man (man) mee (met)

Je bent de ergste

becomes

Je (jij) bent (zijn) de (de) ergste (erg)

Het zijn onze boekjes

becomes

Het (het) zijn (zijn) onze (ons) boekjes (boek)
		`,
		ru:
			/* including a perfective verb, a past participle and an adverb (sometimes get seen as a form of adjectives)  */
			`Он быстро попил воды из купленного им стакана

becomes

Он (он) быстро (быстро) попил (попить) воды (вода) из (из) купленного (купить) им (он) стакана (стакан)`,
		sv: `Use modern Swedish, not verbs like "skola" or "bliva" (use "ska", "bli"). Use "en" as the dictionary form of "ett".

Ge mig hellre det

becomes

Ge (ge) mig (jag) hellre (gärna) det (det)

Det är ett snabbt brev

becomes

Det (det) är (vara) ett (en) snabbt (snabbt) brev (brev)

Små grodorna

becomes

Små (liten) grodorna (groda)

Vi skulle ta oss tid

becomes

Vi (vi) skulle (ska) ta (ta) oss (vi) tid (tid)`
	};

	const response = await ask({
		model: 'gpt-4o',
		messages: (
			[
				{
					role: 'system',
					content: `For every ${language.name} word entered, print it followed by the dictionary form. For any words that are not ${language.name}${
						language.code == 'ko' ? ' or that are particles' : ''
					}, just print the word itself in parenthesis. Print nothing else.
					Example:

${examples[language.code]}`
				}
			] as Message[]
		).concat({
			role: 'user',
			content: sentences
				.map((sentence) => toWordStrings(sentence, language, { doLowerCase: false }).join(' '))
				.join('\n')
		}),
		temperature,
		max_tokens: 1000
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

	let notFoundInRightPlace: string[] = [];

	const ERROR_TOKEN = '__ERROR__';

	let result = await Promise.all(
		sentences.map(async (sentence, i) => {
			let lemmas = lemmasByLine[i] || [];

			return Promise.all(
				toWordStrings(sentence, language).map(async (word, i) => {
					const standardized = standardize(word);

					if (forcedLemmas[language.code][standardized]) {
						return forcedLemmas[language.code][standardized];
					}

					let lemma: { word: string; lemma: string } | undefined = lemmas[i];

					if (!lemma || lemma.word != standardized) {
						notFoundInRightPlace.push(word);

						lemma = lemmas.find((l) => l.word == standardized)!;

						if (!lemma) {
							lemma = lemmasByLine.flat().find((l) => l.word == standardized);
						}
					}

					if (lemma) {
						const result = lemma.lemma;

						if (renamedLemmas[language.code][result]) {
							return renamedLemmas[language.code][result];
						} else {
							return result;
						}
					} else {
						const lemmas = await getLemmasOfWord(standardized, language);

						if (lemmas.length == 1) {
							return lemmas[0].word;
						} else {
							error = `No lemma found for "${standardized}" in sentence "${sentence}", only for ${lemmas.map((l) => l.word).join(', ')}`;

							return onError == 'returnempty' ? ERROR_TOKEN : standardized;
						}
					}
				})
			);
		})
	);

	if (notFoundInRightPlace.length > 0) {
		console.warn(
			`There following lemmas were not where they were expected: ${notFoundInRightPlace.join(', ')}\n` +
				`Sentences:\n${sentences.map((s, i) => ` ${i + 1}. ${s}`).join('\n')}\n` +
				`Lemmas:\n${lemmasByLine.map((l, i) => ` ${i + 1}. ${l.map((l) => `${l.word} (${l.lemma})`).join(' ')}`).join('\n')}`
		);
	}

	if (error) {
		console.error(error);

		if (onError == 'returnempty') {
			result = result.map((lemmas) => (lemmas.includes(ERROR_TOKEN) ? [] : lemmas));
		} else if (onError == 'throw') {
			if (retriesLeft > 0) {
				return lemmatizeBatch(sentences, {
					language,
					retriesLeft: retriesLeft - 1,
					onError
				});
			} else {
				throw new CodedError(error, 'noLemmaFound');
			}
		}
	}

	return result;
}
