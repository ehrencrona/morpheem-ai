import { filterUndefineds } from '$lib/filterUndefineds';
import * as DB from '../db/types';
import { getWordByLemma } from '../db/words';
import { addWrittenSentence } from '../db/writtenSentences';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';

export async function storeWrittenSentence({
	sentence,
	wordId,
	userId,
	language
}: {
	sentence: string;
	wordId: number;
	userId: number;
	language: Language;
}): Promise<DB.Word[]> {
	const [lemmatized] = await lemmatizeSentences([sentence], { language });

	const words = filterUndefineds(
		await Promise.all(
			lemmatized.map(async (lemma) => {
				try {
					return await getWordByLemma(lemma, language);
				} catch (e) {
					console.error(`Unknown word: ${lemma}`);

					return undefined;
				}
			})
		)
	);

	await addWrittenSentence({
		sentence,
		wordId,
		userId,
		language
	});

	console.log(`User ${userId} wrote: ${sentence}`);
	console.log(`Words: ${words.map((w) => w.word).join(', ')}`);

	return words;
}
