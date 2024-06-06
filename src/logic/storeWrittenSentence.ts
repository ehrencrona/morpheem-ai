import { addWrittenSentence } from '../db/writtenSentences';
import { addSentence } from './addSentence';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';

export async function storeWrittenSentence({
	sentence: sentenceString,
	wordId,
	userId,
	language
}: {
	sentence: string;
	wordId: number;
	userId: number;
	language: Language;
}) {
	const [lemmatized] = await lemmatizeSentences([sentenceString], { language });

	const sentence = await addSentence(sentenceString, {
		english: undefined,
		lemmas: lemmatized,
		language,
		userId
	});

	await addWrittenSentence({
		sentence: sentenceString,
		wordId,
		userId,
		language
	});

	return sentence;
}
