import { filterUndefineds } from '$lib/filterUndefineds';
import { KNOWLEDGE_TYPE_WRITE } from '../db/knowledgeTypes';
import { getWordByLemma } from '../db/words';
import { addWrittenSentence } from '../db/writtenSentences';
import { addKnowledge } from './knowledge';
import { lemmatizeSentences } from './lemmatize';

export async function storeWrittenSentence({
	sentence,
	wordId,
	unknownWordIds,
	userId
}: {
	sentence: string;
	wordId: number;
	unknownWordIds: number[];
	userId: number;
}): Promise<void> {
	const [lemmatized] = await lemmatizeSentences([sentence]);

	const knowledge = filterUndefineds(
		await Promise.all(
			lemmatized.map(async (lemma) => {
				try {
					const word = await getWordByLemma(lemma);

					return {
						word: word.word,
						wordId: word.id,
						isKnown: !unknownWordIds.includes(word.id),
						studiedWordId: wordId,
						sentenceId: undefined,
						type: KNOWLEDGE_TYPE_WRITE,
						userId: userId
					};
				} catch (e) {
					console.error(`Unknown word: ${lemma}`);

					return undefined;
				}
			})
		)
	);

	await addWrittenSentence({
		sentence,
		wordId,
		userId
	});

	await addKnowledge(knowledge);

	console.log(
		`Writing feedback stored: ${knowledge.map((w) => `${w.word}${unknownWordIds.includes(w.wordId) ? ' (did not know)' : ''}`).join(', ')}`
	);
}
