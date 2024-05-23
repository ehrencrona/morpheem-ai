import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { KNOWLEDGE_TYPE_READ } from '../../../../db/knowledgeTypes';
import { getMnemonic } from '../../../../db/mnemonics';
import { getSentence } from '../../../../db/sentences';
import * as DB from '../../../../db/types';
import { getWordByLemma } from '../../../../db/words';
import { getWordInSentence } from '../../../../logic/getWordInSentence';
import { addKnowledge } from '../../../../logic/knowledge';
import { addEnglishToSentence, translateWordInContext } from '../../../../logic/translate';
import { userId } from '../../../../logic/user';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	word: z.string(),
	sentenceId: z.number().optional(),
	studiedWordId: z.number(),
	updateKnowledge: z.boolean().optional()
});

export interface UnknownWordResponse extends DB.Word {
	english: string;
	mnemonic?: string;
}

export const POST: ServerLoad = async ({ request }) => {
	let {
		word: wordString,
		sentenceId,
		studiedWordId,
		updateKnowledge
	} = postSchema.parse(await request.json());

	let sentence:
		| (DB.Sentence & {
				english: string;
		  })
		| undefined = undefined;
	let word: DB.Word | undefined = undefined;

	if (sentenceId) {
		sentence = await addEnglishToSentence(await getSentence(sentenceId));

		try {
			word = await getWordInSentence(wordString, sentenceId);
		} catch (e) {
			console.error(e);
		}
	}

	if (!word) {
		word = await getWordByLemma(wordString);
	}

	const { english } = await translateWordInContext(word, sentence);

	const mnemonic = await getMnemonic({ wordId: word.id, userId });

	console.log(`Unknown: ${wordString} (${word.word}) -> ${english}`);

	if (updateKnowledge) {
		await addKnowledge([
			{
				wordId: word.id,
				sentenceId: sentenceId,
				userId: userId,
				isKnown: false,
				studiedWordId,
				type: KNOWLEDGE_TYPE_READ
			}
		]);
	}

	return json({ ...word, english, mnemonic } as UnknownWordResponse);
};
