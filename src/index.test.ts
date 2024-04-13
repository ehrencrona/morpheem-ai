import { DATABASE_URL, OPENAI_API_KEY } from '$env/static/private';
import { Kysely, PostgresDialect, sql } from 'kysely';
import type { DB } from 'kysely-codegen';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { Pool } from 'pg';
import { describe, it } from 'vitest';
import { z } from 'zod';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: DATABASE_URL
		})
	})
});

async function addWord(lemma: string, encounteredForm: string | undefined) {
	console.log(`Adding word ${lemma}...`);

	const result = await db
		.insertInto('words')
		.values({
			word: lemma,
			json: encounteredForm ? { forms: [encounteredForm] } : undefined
		})
		.returning(['id', 'word'])
		.onConflict((oc) => oc.column('word').doNothing())
		.executeTakeFirst();

	if (!result) {
		return db
			.selectFrom('words')
			.select(['id', 'word'])
			.where('word', '=', lemma)
			.executeTakeFirst();
	}

	return result;
}

async function addWordToLemma(lemma: string, encounteredForm: string) {
	console.log(`Adding lemma of ${encounteredForm} -> ${lemma}`);

	const res = await db
		.selectFrom('words')
		.select(['id'])
		.where('word', '=', lemma)
		.executeTakeFirst();

	if (!res) {
		console.warn(`Word ${lemma} not found when adding form ${encounteredForm}`);
		return;
	}

	const { id: lemmaId } = res;

	// insert into word_lemma unless it already exists
	await db
		.insertInto('word_lemma')
		.values({ lemma_id: lemmaId, word: encounteredForm })
		.onConflict((oc) => oc.column('word').doNothing())
		.execute();
}

async function addSentence(sentenceString: string, lemmas: string[]) {
	console.log(`Adding sentence "${sentenceString}"...`)

	const sentenceWords = toWords(sentenceString);

	if (sentenceWords.length !== lemmas.length) {
		console.warn(
			'Number of words does not match number of lemmas:\n',
			sentenceString,
			'\n',
			lemmas
		);

		return;
	}

	const words = await db
		.selectFrom('words')
		.select(['id', 'word'])
		.where('word', 'in', lemmas)
		.execute();

	const missingWords = lemmas
		.map((lemma, i) => [lemma, sentenceWords[i]])
		.filter(([lemma]) => !words.some((word) => word.word === lemma));

	const addedWords = await Promise.all(
		missingWords.map(
			async ([lemma, encounteredForm]) =>
				(await addWord(lemma, encounteredForm != lemma ? encounteredForm : undefined))!
		)
	);

	await Promise.all(
		lemmas
			.map((lemma, i) => [lemma, sentenceWords[i]])
			.filter(([lemma, encounteredForm]) => lemma != encounteredForm)
			.map(([lemma, encounteredForm]) => addWordToLemma(lemma, encounteredForm))
	);

	await db.transaction().execute(async (trx) => {
		const sentence = await trx
			.insertInto('sentences')
			.values({ sentence: sentenceString })
			.returning('id')
			.onConflict((oc) => oc.column('sentence').doNothing())
			.executeTakeFirst();

		if (!sentence) {
			console.warn(`Sentence "${sentenceString}" already exists`);

			return;
		}

		const { id } = sentence!;

		await trx
			.insertInto('word_sentences')
			.values(
				(words as { id: number; word: string | null }[]).concat(addedWords).map((word) => ({
					word_id: word.id,
					sentence_id: id,
					word_index: lemmas.indexOf(word.word!)
				}))
			)
			.onConflict((oc) => oc.columns(['word_id', 'sentence_id']).doNothing())
			.execute();
	});
}

function toWords(sentence: string) {
	return sentence
		.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ')
		.split(' ')
		.filter((word) => word.length > 0)
		.map((word) => word.toLowerCase());
}

async function sentencesToLemmas(sentences: string[]) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: (
			[
				{
					role: 'system',
					content: `For every Polish word entered, print it followed by the dictionary form. Print nothing else. Ignore punctuation.
					Example:

"to są przykłady" 

becomes 
					
to: to
są: jest
przykłady: przykład`
				}
			] as ChatCompletionMessageParam[]
		).concat({ role: 'user', content: sentences.join('\n') }),
		temperature: 0,
		max_tokens: 1000
	});

	const response = completion.choices[0].message.content;

	const standardize = (word: string) => word.toLowerCase();

	let lemmaByWord: Record<string, string> = {};

	(response || '').split('\n').map((line) => {
		let [word, lemma] = line.split(':').map((part) => part.trim());

		if (word && lemma) {
			word = standardize(word);
			lemma = standardize(lemma);

			lemmaByWord[word] = lemma;
		}
	});

	return sentences.map((sentence) =>
		toWords(sentence).map((word) => lemmaByWord[standardize(word)] || word)
	);
}

async function getExampleSentences(lemma: string) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: (
			[
				{
					role: 'system',
					content: `Print six Polish sentences illustrating the use of the entered word as JSON object with the key examples containing the sentences as an array.`
				}
			] as ChatCompletionMessageParam[]
		).concat({ role: 'user', content: lemma }),
		temperature: 1,
		max_tokens: 1000,
		response_format: { type: 'json_object' }
	});

	const response = completion.choices[0].message.content;

	try {
		return z.object({ examples: z.array(z.string()) }).parse(JSON.parse(response!)).examples;
	} catch (e: any) {
		throw new Error(`Error parsing response "${response}"`);
	}
}

async function getWordsWithLessThanNSentences(n: number) {
	const words = await sql<{ id: number; word: string }>`SELECT w.id, w.word
FROM words w
LEFT JOIN (
    SELECT word_id, COUNT(sentence_id) AS sentence_count
    FROM word_sentences
    GROUP BY word_id
) AS ws ON w.id = ws.word_id
WHERE ws.sentence_count < ${n} OR ws.sentence_count IS NULL;`.execute(db);

	return words.rows.map((w) => w.word);
}

describe('database', () => {
	it(
		'lemmatizes words',
		async () => {
			const sentences = await getExampleSentences('piękny');
			const lemmatized = await sentencesToLemmas(sentences);

			console.log(lemmatized.map((a) => a.join(' ')));
		},
		{ timeout: 30000 }
	);

	it(
		'makes up sentences',
		async () => {
			const sentences = await getExampleSentences('piękny');

			console.log(sentences);
		},
		{ timeout: 30000 }
	);

	it(
		'adds sentences',
		async () => {
			const sentence = 'Ta kobieta ma piękne niebieskie oczy.';

			const lemmatized = await sentencesToLemmas([sentence]);

			await addSentence(sentence, lemmatized[0]);
		},
		{ timeout: 30000 }
	);

	it('gets words missing sentences', async () => {
		console.log(await getWordsWithLessThanNSentences(1));
	});

	it.only(
		'recursively adds example sentences',
		async () => {
			await addWord('piękny', undefined);

			const words = await getWordsWithLessThanNSentences(4);

			for (const word of words) {
				const sentences = await getExampleSentences(word);
				const lemmatized = await sentencesToLemmas(sentences);

				await Promise.all(
					sentences.map(async (sentence, i) => {
						await addSentence(sentence, lemmatized[i]);
					})
				);
			}
		},
		{ timeout: 30000 }
	);
});
