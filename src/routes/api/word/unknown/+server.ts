import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { translateWordInContext } from '../../../../ai/translate';
import { getSentence } from '../../../../db/sentences';
import { getWordByLemma } from '../../../../db/words';
import { addKnowledge } from '../../../../logic/knowledge';
import { userId } from '../../../../logic/user';

const postSchema = z.object({
	word: z.string(),
	sentenceId: z.number()
});

export interface UnknownWordResponse {
	word: string;
	lemma: string;
	english: string;
	id: number;
}

export const POST: ServerLoad = async ({ request }) => {
	let { word: wordString, sentenceId } = postSchema.parse(await request.json());

	const sentence = await getSentence(sentenceId);

	const { lemma, english } = await translateWordInContext(wordString, sentence.sentence);

	let word = await getWordByLemma(lemma);

	await addKnowledge([
		{
			wordId: word.id,
			sentenceId: sentenceId,
			userId: userId,
			isKnown: false
		}
	]);

	return json({ ...word, lemma, english } as UnknownWordResponse);
};
