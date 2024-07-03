import { Sentence } from '../db/types';
import { addWrittenSentence } from '../db/writtenSentences';
import { addSentence } from './addSentence';
import { lemmatizeSentences } from './lemmatize';
import { Language, SentenceWord } from './types';

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
	let sentence: (Sentence & { words: SentenceWord[] }) | undefined;

	if (createNewSentence) {
		const [lemmatized] = await lemmatizeSentences([sentenceString], { language });

		sentence = await addSentence(sentenceString, {
			english: undefined,
			lemmas: lemmatized,
			language,
			userId
		});
	}

	await addWrittenSentence({
		sentence: sentenceString,
		entered,
		wordId,
		userId,
		language
	});

	return sentence;
}
