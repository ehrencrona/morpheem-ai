import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import { getWordByLemma } from '../db/words';
import { addKnowledge } from './knowledge';
import { lemmatizeSentences } from './lemmatize';
import { userId } from './user';

export async function storeWrittenSentence({
	sentence,
	wordId
}: {
	sentence: string;
	wordId: number;
}): Promise<void> {
	const [lemmatized] = await lemmatizeSentences([sentence]);

	const knowledge = await Promise.all(
		lemmatized.map(async (lemma) => {
			const word = await getWordByLemma(lemma);

			return {
				wordId: word.id,
				isKnown: true,
				studiedWordId: wordId,
				sentenceId: undefined,
				type: KNOWLEDGE_TYPE_WRITE,
				userId: userId
			};
		})
	);

	console.log(`Writing feedback stored: ${lemmatized.join(', ')}`);

	await addKnowledge(knowledge);
}
