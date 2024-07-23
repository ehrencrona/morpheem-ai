import { z } from 'zod';
import { ask } from '../../ai/ask';
import { askForJson } from '../../ai/askForJson';
import { POLISH } from '../../constants';
import { getWords } from '../../db/words';
import { lemmatizeSentences } from '../../logic/lemmatize';
import { unzip, zip } from '$lib/zip';
import { addSentences } from '../../logic/addSentence';

const UNIT = 16;
const FOCUS = 'instrumental plural';
const SENTENCE_COUNT = 15;

function memoize<T>(fn: () => Promise<T>) {
	let promise: Promise<T> | undefined;

	return async () => {
		if (!promise) {
			promise = fn();
		}

		return promise;
	};
}

const organizeVocab = memoize(async () => {
	const words = await getWords({ upToUnit: UNIT, language: POLISH });

	return ask({
		messages: [
			{
				role: 'user',
				content:
					`Please organize these Polish words by word type and write them separated by commas on a line for each word type, e.g. \nnouns: samochód, telefon\n\n\verbs: ...\n\n` +
					`Words: ${words.map((w) => w.word).join(', ')}`
			}
		],
		model: 'claude-3-5-sonnet-20240620',
		temperature: 0,
		logResponse: true
	});
});

async function getInvalid(sentences: string[]) {
	const res = await ask({
		messages: [
			{
				role: 'user',
				content:
					`Go through these Polish sentences, one per line, and evaluate if it is grammatically correct and makes logical sense (in the sense of: could you actually use this sentence in real life).\n` +
					`Repeat the sentence back to me, and then add " -- correct" on the same line if it is correct, or " -- incorrect" if it is incorrect. Do not write anything else\n\n` +
					`Sentences:\n` +
					`${sentences.map((s) => ` - ${s}`).join('\n')}`
			}
		],
		model: 'gpt-4o',
		temperature: 0.3
	});

	return res
		.split('\n')
		.filter((m) => m.match(/ -- incorrect$/))
		.map((m) => m.replace(/^ +- /, ''))
		.map((m) => m.split(' -- incorrect')[0])
		.map((invalid) => {
			if (!sentences.includes(invalid)) {
				console.error(`Invalid sentence "${invalid}" not in original sentences`);
			}

			return invalid;
		});
}

async function generateSentences(lemma: string) {
	const res = await askForJson({
		messages: [
			{
				role: 'user',
				content: `We are looking to generate Polish sentences for language learners as examples how to use vocabulary. The sentences should only contain the following vocabulary:

${await organizeVocab()}

We are looking for ${SENTENCE_COUNT} Polish sentences using the word "${lemma}" (in some form) and ideally using the ${FOCUS}. Use only the vocabulary above.
We want as much variety in the form of the sentences as possible (different subjects/word order/formality level/questions/past/present). 
It is very important that you use only the provided vocabulary and no other words.

When writing with a limited vocabulary there are certain sentences that can be generated with pretty much every word. Here some examples for the word e-mail:
- Ja lubię ten e-mail. 
- Ewa dostał e-mail. 
- Czy masz ten e-mail?

We do NOT want these monotonous sentences. We are trying to write sentences that tell more of a story, that have some sort of logic to them, for example:
- Czy twój e-mail o spotkaniu jest już gotowy?
- Kiedy dostajesz e-mail, zawsze szybko odpowiadasz?
- Muszę używać komputera, żeby pisać e-mail.

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
}

const allVocab = new Set(
	(await getWords({ language: POLISH, upToUnit: UNIT })).map(({ word }) => word)
);

for (const word of [
	'aktor',
	'dokument',
	'idea',
	'inżynier',
	'lekarz',
	'patrzeć',
	'podróż',
	'ptak',
	'rano',
	'ryba',
	'sprawiać',
	'sprawić',
	'teraz',
	'uczucie',
	'wielki',
	'wymagać'
]) {
	let sentences = await generateSentences(word);

	const invalid = await getInvalid(sentences);

	sentences = sentences.filter((s) => !invalid.includes(s));

	let lemmas = await lemmatizeSentences(sentences, { language: POLISH, onError: 'returnempty' });

	[sentences, lemmas] = unzip(
		zip(sentences, lemmas).filter(([sentence, lemmas]) => {
			if (lemmas.length == 0) {
				console.error(`Could not parse sentence "${sentence}"`);

				return false;
			}

			const unknownWords = lemmas.filter((lemma) => !allVocab.has(lemma));

			if (unknownWords.length > 1) {
				console.error(
					`Sentence "${sentence}" contains too many words not in the vocabulary: ${unknownWords.join(', ')}`
				);

				return false;
			} else if (unknownWords.length == 1) {
				console.warn(
					`Sentence "${sentence}" contains word not in the vocabulary: ${unknownWords[0]}`
				);
			}

			return true;
		})
	);

	await addSentences(sentences, undefined, lemmas, {
		language: POLISH,
		unit: UNIT
	});
}
