import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getMnemonic } from '../../../../db/mnemonics';
import { getSentence } from '../../../../db/sentences';
import * as DB from '../../../../db/types';
import { getWordByLemma } from '../../../../db/words';
import { getWordInSentence } from '../../../../logic/getWordInSentence';
import { addEnglishToSentence, translateWordInContext } from '../../../../logic/translate';
import { userId } from '../../../../logic/user';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	word: z.string(),
	sentenceId: z.number().optional()
});

export interface UnknownWordResponse extends DB.Word {
	english: string;
	mnemonic?: string;
}

export const POST: ServerLoad = async ({ request }) => {
	let { word: wordString, sentenceId } = postSchema.parse(await request.json());

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

	return json({ ...word, english, mnemonic } as UnknownWordResponse);
};
