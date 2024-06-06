import { ServerLoad, json } from '@sveltejs/kit';
import { z } from 'zod';
import { generateTranslationFeedback } from '../../../../../ai/generateWritingFeedback';
import { getSentence } from '../../../../../db/sentences';
import * as DB from '../../../../../db/types';
import { getWordsOfSentence } from '../../../../../db/words';
import { getSentenceWords } from '../../../../../logic/addSentence';
import {
	filterClearlyKnownWords,
	wordsToUnknownWords
} from '../../../../../logic/findProvidedWordsInAnswer';
import { lemmatizeSentences } from '../../../../../logic/lemmatize';
import { addEnglishToSentence } from '../../../../../logic/translate';
import { UnknownWordResponse } from '../../word/unknown/+server';

export type PostSchema = z.infer<typeof postSchema>;
export type TranslationFeedbackResponse = Awaited<
	ReturnType<typeof generateTranslationFeedback>
> & {
	exercise: 'translate';
	corrected: string;
	unknownWords: UnknownWordResponse[];
	words: DB.Word[];
};

const postSchema = z.object({
	sentenceId: z.number(),
	entered: z.string()
});

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	const { sentenceId, entered } = postSchema.parse(await request.json());

	const sentence = await addEnglishToSentence(await getSentence(sentenceId, language), language);

	const feedback = await generateTranslationFeedback(
		{ english: sentence.english, correct: sentence.sentence, entered },
		language
	);

	const lemmatizedEntered = (
		await lemmatizeSentences([entered], { language, ignoreErrors: true })
	)[0];

	const enteredWords = await getSentenceWords(entered, lemmatizedEntered, language);
	const correctWords = await getWordsOfSentence(sentenceId, language);

	let missedWords: DB.Word[] = correctWords.filter(
		(word) => !lemmatizedEntered.includes(word.word)
	);

	console.log(
		`User missed the words ${missedWords.map(({ word }) => word).join(', ')} in the translation "${entered}" as opposed to the correct answer "${sentence.sentence}".`
	);

	missedWords = await filterClearlyKnownWords(missedWords, userId!, language);

	return json({
		...feedback,
		exercise: 'translate',
		corrected: sentence.sentence,
		unknownWords: await wordsToUnknownWords(missedWords, userId!, language),
		words: enteredWords
	} satisfies TranslationFeedbackResponse);
};
