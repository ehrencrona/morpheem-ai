import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateWritingFeedback } from '../../../../../ai/generateWritingFeedback';
import { lemmatizeSentences } from '../../../../../logic/lemmatize';
import {
	filterClearlyKnownWords,
	wordStringsToWords,
	wordsToUnknownWords
} from '../../../../../logic/findProvidedWordsInAnswer';
import { UnknownWordResponse } from '../../word/unknown/+server';

export type PostSchema = z.infer<typeof postSchema>;
export type FeedbackResponse = Awaited<ReturnType<typeof generateWritingFeedback>> & {
	unknownWords: UnknownWordResponse[];
};

const postSchema = z.object({
	sentence: z.string(),
	word: z.string()
});

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	const { sentence, word } = postSchema.parse(await request.json());

	const feedback = await generateWritingFeedback(sentence, word, language);

	const [lemmatizedOriginal, lemmatizedCorrected] = await Promise.all([
		// we do two different calls because chatgpt gets confused receiving two very similar sentences
		lemmatizeSentences([sentence], { language, ignoreErrors: true }).then(([res]) => res),
		lemmatizeSentences([feedback.corrected], { language, ignoreErrors: true }).then(([res]) => res)
	]);

	const newWordStrings = lemmatizedCorrected.filter((word) => !lemmatizedOriginal.includes(word));

	let newWords = await wordStringsToWords(newWordStrings, feedback.corrected, language);

	console.log(
		`User was provided with the words ${newWords.map(({ word }) => word).join(', ')} in the correction "${feedback.corrected}".`
	);

	newWords = await filterClearlyKnownWords(newWords, userId!, language);

	return json({
		...feedback,
		unknownWords: await wordsToUnknownWords(newWords, userId!, language)
	} satisfies FeedbackResponse);
};
