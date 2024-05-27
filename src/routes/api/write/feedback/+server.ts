import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateWritingFeedback } from '../../../../ai/generateWritingFeedback';
import { lemmatizeSentences } from '../../../../ai/lemmatize';
import {
	filterClearlyKnownWords,
	wordStringsToWords,
	wordsToUnknownWords
} from '../../../../logic/findProvidedWordsInAnswer';
import { UnknownWordResponse } from '../../word/unknown/+server';

export type PostSchema = z.infer<typeof postSchema>;
export type FeedbackResponse = Awaited<ReturnType<typeof generateWritingFeedback>> & {
	unknownWords: UnknownWordResponse[];
};

const postSchema = z.object({
	sentence: z.string(),
	word: z.string()
});

export const POST: ServerLoad = async ({ request }) => {
	const { sentence, word } = postSchema.parse(await request.json());

	const feedback = await generateWritingFeedback(sentence, word);

	const [lemmatizedOriginal, lemmatizedCorrected] = await lemmatizeSentences([
		sentence,
		feedback.corrected
	]);

	const newWordStrings = lemmatizedCorrected.filter((word) => !lemmatizedOriginal.includes(word));

	let newWords = await wordStringsToWords(newWordStrings, feedback.corrected);

	console.log(
		`User was provided with the words ${newWords.map(({ word }) => word).join(', ')} in the correction "${feedback.corrected}".`
	);

	newWords = await filterClearlyKnownWords(newWords);

	return json({
		...feedback,
		unknownWords: await wordsToUnknownWords(newWords)
	} satisfies FeedbackResponse);
};
