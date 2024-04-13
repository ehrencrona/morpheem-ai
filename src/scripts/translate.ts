import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from 'kysely-codegen';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { Pool } from 'pg';

const OPENAI_API_KEY = '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';
const DATABASE_URL = 'postgres://andreasehrencrona@localhost/morpheem';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

async function translate(sentence: string) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: (
			[
				{
					role: 'system',
					content: `Translate the ${sentence.includes(' ') ? 'text' : 'word'} from Polish to English.`
				}
			] as ChatCompletionMessageParam[]
		).concat({ role: 'user', content: sentence }),
		temperature: 0.3,
		max_tokens: 300
	});

	const english = completion.choices[0].message.content || '';

	if (
		(english?.length < sentence.length / 4 || english?.length > sentence.length * 4) &&
		Math.abs(english.length - sentence.length) > 10
	) {
		throw new Error(`Translation of ${sentence} failed: ${english}`);
	}

	return english;
}

const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: DATABASE_URL
		})
	})
});

const sentences = await db
	.selectFrom('sentences')
	.select(['id', 'sentence'])
	.where('english', 'is', null)
	.execute();

for (const sentence of sentences) {
	const english = await translate(sentence.sentence);

	console.log(`${sentence.sentence} -> ${english}`);

	await db.updateTable('sentences').set('english', english).where('id', '=', sentence.id).execute();
}

const words = await db
	.selectFrom('words')
	.select(['id', 'word'])
	.where('english', 'is', null)
	.execute();

for (const word of words) {
	const english = await translate(word.word || '');

	console.log(`${word.word} -> ${english}`);

	await db.updateTable('words').set('english', english).where('id', '=', word.id).execute();
}

process.exit(0);
