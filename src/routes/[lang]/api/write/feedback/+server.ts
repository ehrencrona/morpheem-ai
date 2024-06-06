import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateWritingFeedback } from '../../../../../ai/generateWritingFeedback';
import * as DB from '../../../../../db/types';
import { getSentenceWords } from '../../../../../logic/addSentence';
import {
	filterClearlyKnownWords,
	wordsToUnknownWords
} from '../../../../../logic/findProvidedWordsInAnswer';
import { lemmatizeSentences } from '../../../../../logic/lemmatize';
import { UnknownWordResponse } from '../../word/unknown/+server';

export type PostSchema = z.infer<typeof postSchema>;
export type WritingFeedbackResponse = Awaited<ReturnType<typeof generateWritingFeedback>> & {
	exercise: 'write';
	unknownWords: UnknownWordResponse[];
	words: DB.Word[];
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

	const allWords = await getSentenceWords(feedback.corrected, lemmatizedCorrected, language);

	const newLemmas = lemmatizedCorrected.filter((word) => !lemmatizedOriginal.includes(word));

	let newWords: DB.Word[] = allWords.filter((word) => newLemmas.includes(word.word));

	console.log(
		`User was provided with the words ${newWords.map(({ word }) => word).join(', ')} in the correction "${feedback.corrected}".`
	);

	newWords = await filterClearlyKnownWords(newWords, userId!, language);

	return json({
		...feedback,
		exercise: 'write',
		unknownWords: await wordsToUnknownWords(newWords, userId!, language),
		words: allWords
	} satisfies WritingFeedbackResponse);
};
