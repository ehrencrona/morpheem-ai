import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { KNOWLEDGE_TYPE_READ } from '../../../../../db/knowledgeTypes';
import { getMultipleWordsByLemmas } from '../../../../../db/words';
import { lemmatizeSentences } from '../../../../../logic/lemmatize';
import { toSentences } from '../../../../../logic/toSentences';
import { updateKnowledge } from '../../../../../logic/updateKnowledge';

const postSchema = z.object({
	text: z.string(),
	unknownWordIds: z.array(z.number())
});

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const { text, unknownWordIds } = postSchema.parse(await request.json());

	const sentences = toSentences(text);

	const lemmas = (await lemmatizeSentences(sentences, { language, ignoreErrors: true })).flat();

	const words = await getMultipleWordsByLemmas(lemmas, language);

	const knowledge = words
		.map((word) => ({
			wordId: word.id,
			userId,
			type: KNOWLEDGE_TYPE_READ,
			isKnown: !unknownWordIds.includes(word.id)
		}))
		.concat(
			unknownWordIds
				.filter((id) => !words.some((word) => word.id === id))
				.map((id) => ({
					wordId: id,
					userId,
					type: KNOWLEDGE_TYPE_READ,
					isKnown: false
				}))
		);

	await updateKnowledge(knowledge, language);

	console.log(
		`Added ${knowledge.length} words to knowledge for user ${userId} in ${language.name}: ${words
			.map((word) => word.word + (unknownWordIds.includes(word.id) ? ' (unknown)' : ''))
			.join(', ')}`
	);

	return json({});
};
