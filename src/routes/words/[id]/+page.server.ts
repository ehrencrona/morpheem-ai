import { type ServerLoad } from '@sveltejs/kit';
import { getForms } from '../../../db/lemmas';
import { getSentencesWithWord } from '../../../db/sentences';
import { getWordById } from '../../../db/words';
import { getAggregateKnowledgeForUserWords } from '../../../db/knowledge';
import { userId } from '../../../logic/user';
import { expectedKnowledge, now } from '../../../logic/isomorphic/knowledge';

export const load = (async ({ params }) => {
	const wordId = parseInt(params.id!);

	const word = await getWordById(wordId);

	const sentences = await getSentencesWithWord(wordId);

	const forms = await getForms(wordId);

	const knowledge = await getAggregateKnowledgeForUserWords({
		userId,
		wordIds: [wordId]
	});

	const wordKnowledge = knowledge.length
		? expectedKnowledge(knowledge[0], { now: now(), lastTime: knowledge[0].time })
		: 0;

	return {
		sentences,
		word,
		forms,
		wordKnowledge
	};
}) satisfies ServerLoad;
