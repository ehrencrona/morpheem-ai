import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getMnemonic } from '../../../../../db/mnemonics';
import { getSentence } from '../../../../../db/sentences';
import * as DB from '../../../../../db/types';
import { getWordByLemma, getWordsOfSentence } from '../../../../../db/words';
import { getWordInSentence } from '../../../../../logic/getWordInSentence';
import { addEnglishToSentence, translateWordInContext } from '../../../../../logic/translate';
import { logError } from '$lib/logError';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	word: z.string(),
	sentenceId: z.number().optional()
});

export interface UnknownWordResponse extends DB.Word {
	english: string;
	mnemonic?: string;
	inflected?: string;
	form?: string;
	transliteration?: string;
}

export const POST: ServerLoad = async ({ request, locals }) => {
	const userId = locals.user!.num;
	const { language } = locals;
	let { word: wordString, sentenceId } = postSchema.parse(await request.json());

	let sentence:
		| (DB.Sentence & {
				english: string;
		  })
		| undefined = undefined;
	let word: DB.Word | undefined = undefined;

	if (sentenceId) {
		sentence = await addEnglishToSentence(await getSentence(sentenceId, language), language);

		try {
			const sentenceWords = await getWordsOfSentence(sentenceId, language);

			word = await getWordInSentence(wordString, sentenceId, sentenceWords, language);
		} catch (e) {
			logError(e);
		}
	}

	if (!word) {
		word = await getWordByLemma(wordString, language);
	}

	const { english, form, transliteration } = await translateWordInContext(word, {
		wordString,
		sentence,
		language
	});

	const mnemonic = await getMnemonic({ wordId: word.id, userId, language });

	console.log(`Unknown: ${wordString} (${word.word}) -> ${english}`);

	return json({
		...word,
		english,
		inflected: wordString != word.word ? wordString : undefined,
		form,
		mnemonic,
		transliteration
	} satisfies UnknownWordResponse);
};
