import { addWrittenSentence } from '../db/writtenSentences';
import { addSentence } from './addSentence';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';

export async function storeWrittenSentence({
	sentence: sentenceString,
	entered,
	wordId,
	userId,
	language,
	createNewSentence
}: {
	sentence: string;
	entered: string;
	wordId?: number;
	userId: number;
	language: Language;
	createNewSentence: boolean;
}) {
	const [lemmatized] = await lemmatizeSentences([sentenceString], { language });

	const sentence = createNewSentence
		? await addSentence(sentenceString, {
				english: undefined,
				lemmas: lemmatized,
				language,
				userId
			})
		: undefined;

	await addWrittenSentence({
		sentence: sentenceString,
		entered,
		wordId,
		userId,
		language
	});

	return sentence;
}
