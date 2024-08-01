import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { TranslatedWord } from '../../../../../ai/translate';
import { CodedError } from '../../../../../CodedError';
import { getMnemonic } from '../../../../../db/mnemonics';
import { getSentence } from '../../../../../db/sentences';
import * as DB from '../../../../../db/types';
import { getWordByLemma, getWordsOfSentence } from '../../../../../db/words';
import { addWord } from '../../../../../logic/addWord';
import { getWordInSentence } from '../../../../../logic/getWordInSentence';
import {
	QuicklyTranslatedWord,
	translateWordInContext,
	translateWordOutOfContext
} from '../../../../../logic/translate';
import { SentenceWord } from '../../../../../logic/types';

export type PostSchema = z.infer<typeof postSchema>;

const postSchema = z.object({
	word: z.string(),
	sentenceId: z.number().optional(),
	sentence: z.string().optional()
});

export interface UnknownWordResponse extends DB.Word, TranslatedWord {
	mnemonic?: string;
	inflected?: string;
}

export const POST: ServerLoad = async ({ request, url, locals }) => {
	const userId = locals.user!.num;
	const { language } = locals;
	let {
		word: wordString,
		sentenceId,
		sentence: sentenceString
	} = postSchema.parse(await request.json());

	const useQuickAndDirty = url.searchParams.has('quick');

	let sentence: { id: number | undefined; sentence: string } | undefined = undefined;
	let word: DB.Word | undefined = undefined;

	if (sentenceId) {
		let sentenceWords: SentenceWord[];

		[sentence, sentenceWords] = await Promise.all([
			getSentence(sentenceId, language),
			getWordsOfSentence(sentenceId, language)
		]);

		word = await getWordInSentence(wordString, sentenceId, sentenceWords, language);
	} else if (sentenceString) {
		sentence = {
			id: undefined,
			sentence: sentenceString
		};
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

	const {
		english,
		form,
		transliteration,
		expression,
		isQuickAndDirty = false
	} = sentence
		? await translateWordInContext(wordString, {
				word,
				sentence,
				language,
				isQuickAndDirty: useQuickAndDirty
			})
		: {
				...(await translateWordOutOfContext(wordString, { language, word })),
				expression: undefined
			};

	const mnemonic = await getMnemonic({ wordId: word.id, userId, language });

	console.log(
		`Unknown word: ${wordString} (${word.word}) -> ${english}${isQuickAndDirty ? ' (quick and dirty)' : ''}`
	);

	return json({
		...word,
		english,
		inflected: wordString != word.word ? wordString : undefined,
		form,
		mnemonic,
		transliteration,
		expression,
		isQuickAndDirty
	} satisfies UnknownWordResponse & QuicklyTranslatedWord);
};
