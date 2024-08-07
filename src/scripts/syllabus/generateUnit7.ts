import { unzip, zip } from '$lib/zip';
import { z } from 'zod';
import { ask } from '../../ai/ask';
import { askForJson } from '../../ai/askForJson';
import { findInvalidSentences } from '../../ai/findInvalidSentences';
import { RUSSIAN, SPANISH } from '../../constants';
import { getSentencesWithWord } from '../../db/sentences';
import { getWordByLemma, getWords } from '../../db/words';
import { addSentences } from '../../logic/addSentence';
import { lemmatizeSentences } from '../../logic/lemmatize';
import { getUnits } from '../../db/units';

const SENTENCE_COUNT = 10;
const language = RUSSIAN;

function memoize<T>(fn: () => Promise<T>) {
	let promise: Promise<T> | undefined;

	return async () => {
		if (!promise) {
			promise = fn();
		}

		return promise;
	};
}

const units = await getUnits(language);

for (const unit of units) {
	if (unit.id < 11) {
		continue;
	}

	console.log(`\n\n***** UNIT ${unit.id} *****\n\n`);

	const unitId = unit.id;
	const FOCUS = unit.name;

	const organizeVocab = memoize(async () => {
		const words = await getWords({ upToUnit: unitId, language });

		return ask({
			messages: [
				{
					role: 'user',
					content:
						`Please organize these ${language.name} words by word type and write them separated by commas on a line for each word type, e.g. \nnouns: магазин, хлеб\n\n\verbs: ...\n\n` +
						`Words: ${words.map((w) => w.word).join(', ')}`
				}
			],
			model: 'claude-3-5-sonnet-20240620',
			temperature: 0,
			logResponse: true
		});
	});

	async function generateSentences(lemma: string, retriesLeft = 1) {
		try {
			const res = await askForJson({
				messages: [
					{
						role: 'user',
						content: `We are looking to generate ${language.name} sentences for language learners as examples how to use vocabulary. The sentences should only contain the following vocabulary:
					
					${await organizeVocab()}
					
					We are looking for ${SENTENCE_COUNT} ${language.name} sentences using the word "${lemma}" (in some form) and ideally using the ${FOCUS}. Use only the vocabulary above.
					We want as much variety in the form of the sentences as possible (different subjects/word order/formality level/questions/past/present). 
					It is very important that you use only the provided vocabulary and no other words.
					
					When writing with a limited vocabulary there are certain sentences that can be generated with pretty much every word. Here some examples for the word телефон:
					•	Мне нравится телефон.
					•	Телефон большой.
					•	У тебя есть телефон?
					
					We do NOT want these monotonous sentences. We are trying to write sentences that tell more of a story, that have some sort of logic to them, for example:
					•	Я забыл свой телефон в такси. Можешь позвонить на него, пожалуйста?
					•	Что ты делаешь, если потеряешь свой телефон?
					•	Оставь телефон дома и наслаждайся природой.
					
					We will proceed step by step to generate the sentences.
					
					1. First brainstorm ${SENTENCE_COUNT * 2} sentences with as much variety as possible. Focus on natural language; things you might actually say in a real situation. Try to find scenarios where things happen that tie the sentence together.
					2. Narrow down and modify the previous sentences to make sure they only use the required vocabulary and that they are not monotonous.
					
					Return JSON in the format { brainstorms: ["sentence 1", "sentence 2", ...], finalSentences: ["sentence 1", "sentence 2", ...] }`
					}
				],
				model: 'claude-3-5-sonnet-20240620',
				temperature: 1,
				schema: z.object({
					finalSentences: z.array(z.string())
				})
			});

			return res.finalSentences;
		} catch (e) {
			if (retriesLeft > 0) {
				console.error(e);

				return generateSentences(lemma, retriesLeft - 1);
			}

			throw e;
		}
	}

	const allVocab = new Set(
		(await getWords({ language, upToUnit: unitId })).map(({ word }) => word)
	);
	const thisVocab = new Set((await getWords({ language, unit: unitId })).map(({ word }) => word));

	for (const word of thisVocab) {
		const wordObj = await getWordByLemma(word, language);
		const existingSentences = await getSentencesWithWord(wordObj.id, { language, unit: unitId });

		if (existingSentences.length >= SENTENCE_COUNT / 2) {
			console.log(`Already have enough sentences for ${word}, skipping`);

			continue;
		}

		let sentences = await generateSentences(word);

		const invalid = await findInvalidSentences(sentences, language);

		sentences = sentences.filter((s) => !invalid.includes(s));

		let lemmas = await lemmatizeSentences(sentences, { language, onError: 'returnempty' });

		[sentences, lemmas] = unzip(
			zip(sentences, lemmas).filter(([sentence, lemmas]) => {
				if (lemmas.length == 0) {
					console.error(`Could not parse sentence "${sentence}"`);

					return false;
				}

				if (!allVocab.has(word)) {
					throw new Error(
						`Word "${word}" not in vocabulary for unit ${unitId}, only ${Array.from(allVocab).join(', ')}`
					);
				}

				const unknownWords = lemmas.filter((lemma) => !allVocab.has(lemma));

				if (unknownWords.length > 1) {
					console.error(
						`Sentence "${sentence}" contains too many words not in the vocabulary for unit ${unitId}: ${unknownWords.join(', ')}`
					);

					return false;
				} else if (unknownWords.length == 1) {
					console.warn(
						`Sentence "${sentence}" contains word not in the vocabulary: ${unknownWords[0]}`
					);
				} else {
					console.log(`Added sentence "${sentence}" for word "${word}" to unit ${unitId}`);
				}

				return true;
			})
		);

		await addSentences(sentences, undefined, lemmas, {
			language,
			unit: unitId
		});
	}
}
