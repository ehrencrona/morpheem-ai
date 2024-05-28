import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateWritingFeedback } from '../../../../../ai/generateWritingFeedback';
import { lemmatizeSentences } from '../../../../../ai/lemmatize';
import {
	filterClearlyKnownWords,
	wordStringsToWords,
	wordsToUnknownWords
} from '../../../../../logic/findProvidedWordsInAnswer';
import { UnknownWordResponse } from '../../word/unknown/+server';
import { POLISH } from '../../../../../constants';

export type PostSchema = z.infer<typeof postSchema>;
export type FeedbackResponse = Awaited<ReturnType<typeof generateWritingFeedback>> & {
	unknownWords: UnknownWordResponse[];
};

const postSchema = z.object({
	sentence: z.string(),
	word: z.string()
});

export const POST: ServerLoad = async ({ request, locals }) => {
	const { sentence, word } = postSchema.parse(await request.json());
	const { language } = locals;
	const userId = locals.user!.num;

	const feedback = await generateWritingFeedback(sentence, word, POLISH);

	const [lemmatizedOriginal, lemmatizedCorrected] = await lemmatizeSentences(
		[sentence, feedback.corrected],
		{ language: POLISH }
	);

	const newWordStrings = lemmatizedCorrected.filter((word) => !lemmatizedOriginal.includes(word));

	let newWords = await wordStringsToWords(newWordStrings, feedback.corrected, language);

	console.log(
		`User was provided with the words ${newWords.map(({ word }) => word).join(', ')} in the correction "${feedback.corrected}".`
	);

	newWords = await filterClearlyKnownWords(newWords, userId, language);

	return json({
		...feedback,
		unknownWords: await wordsToUnknownWords(newWords, userId, language)
	} satisfies FeedbackResponse);
};
