import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import { getMultipleWordsByLemmas } from '../db/words';
import { addWrittenSentence } from '../db/writtenSentences';
import { addSentence } from './addSentence';
import { lemmatizeSentences } from './lemmatize';
import { Language } from './types';

export async function storeWrittenSentence({
	sentence: sentenceString,
	entered,
	wordId,
	userId,
	language
}: {
	sentence: string;
	entered: string;
	wordId?: number;
	userId: number;
	language: Language;
}) {
	const [lemmatized] = await lemmatizeSentences([sentenceString], { language });

	const [sentence, words] = await Promise.all([
		addSentence(sentenceString, {
			english: undefined,
			lemmas: lemmatized,
			language,
			userId
		}),

		getMultipleWordsByLemmas(lemmatized, language),

		addWrittenSentence({
			sentence: sentenceString,
			entered,
			wordId,
			userId,
			language
		})
	]);

	const knowledge = words.map((word) => ({
		word,
		wordId: word.id,
		isKnown: true,
		sentenceId: sentence.id,
		type: KNOWLEDGE_TYPE_WRITE,
		userId
	}));

	return { sentence, lemmatized, knowledge };
}
