import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { translateWordInContext } from '../../../../ai/translate';
import { getSentence } from '../../../../db/sentences';
import { getWordInSentence } from '../../../../logic/getWordInSentence';
import { addKnowledge } from '../../../../logic/knowledge';
import { userId } from '../../../../logic/user';
import * as DB from '../../../../db/types';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	word: z.string(),
	sentenceId: z.number(),
	studiedWordId: z.number()
});

export interface UnknownWordResponse extends DB.Word {
	english: string;
}

export const POST: ServerLoad = async ({ request }) => {
	let { word: wordString, sentenceId, studiedWordId } = postSchema.parse(await request.json());

	const sentence = await getSentence(sentenceId);

	const word = await getWordInSentence(wordString, sentenceId);

	const { english } = await translateWordInContext(word.word, sentence);

	console.log(`Unknown: ${wordString} (${word.word}) -> ${english}`);

	await addKnowledge([
		{
			wordId: word.id,
			sentenceId: sentenceId,
			userId: userId,
			isKnown: false,
			studiedWordId
		}
	]);

	return json({ ...word, english } as UnknownWordResponse);
};
