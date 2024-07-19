import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { getMnemonic } from '../../../../../db/mnemonics';
import { getSentence } from '../../../../../db/sentences';
import * as DB from '../../../../../db/types';
import { getWordByLemma, getWordsOfSentence } from '../../../../../db/words';
import { getWordInSentence } from '../../../../../logic/getWordInSentence';
import {
	addEnglishToSentence,
	translateWordInContext,
	translateWordOutOfContext
} from '../../../../../logic/translate';
import { logError } from '$lib/logError';
import { CodedError } from '../../../../../CodedError';
import { addWord } from '../../../../../logic/addWord';

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
	expression?: {
		expression: string;
		english: string;
	};
}

export const POST: ServerLoad = async ({ request, locals }) => {
	const userId = locals.user!.num;
	const { language } = locals;
	let { word: wordString, sentenceId } = postSchema.parse(await request.json());

	let sentence: DB.Sentence | undefined = undefined;
	let word: DB.Word | undefined = undefined;

	if (sentenceId) {
		sentence = await getSentence(sentenceId, language);

		try {
			const sentenceWords = await getWordsOfSentence(sentenceId, language);

			word = await getWordInSentence(wordString, sentenceId, sentenceWords, language);
		} catch (e) {
			logError(e);
		}
	}

	if (!word) {
		try {
			word = await getWordByLemma(wordString, language);
		} catch (e) {
			if ((e as CodedError).code == 'noSuchWord') {
				word = await addWord(wordString, { language });
			} else {
				throw e;
			}
		}
	}

	const { english, form, transliteration, expression } = sentence
		? await translateWordInContext(wordString, {
				word,
				sentence,
				language
			})
		: {
				...(await translateWordOutOfContext(wordString, { language, word })),
				expression: undefined
			};

	const mnemonic = await getMnemonic({ wordId: word.id, userId, language });

	console.log(`Unknown: ${wordString} (${word.word}) -> ${english}`);

	return json({
		...word,
		english,
		inflected: wordString != word.word ? wordString : undefined,
		form,
		mnemonic,
		transliteration,
		expression
	} satisfies UnknownWordResponse);
};
