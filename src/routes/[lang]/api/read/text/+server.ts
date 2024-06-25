import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { addKnowledge } from '../../../../../db/knowledge';
import { KNOWLEDGE_TYPE_READ } from '../../../../../db/knowledgeTypes';
import { getMultipleWordsByLemmas } from '../../../../../db/words';
import { lemmatizeSentences } from '../../../../../logic/lemmatize';
import { toSentences } from '../../../../../logic/toSentences';

const postSchema = z.object({
	text: z.string()
});

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const { text } = postSchema.parse(await request.json());

	const sentences = toSentences(text);

	const lemmas = (await lemmatizeSentences(sentences, { language, ignoreErrors: true })).flat();

	const words = await getMultipleWordsByLemmas(lemmas, language);

	await addKnowledge(
		words.map((word) => ({
			wordId: word.id,
			userId,
			type: KNOWLEDGE_TYPE_READ,
			isKnown: true
		})),
		language
	);

	console.log(
		`Added ${words.length} words to knowledge for user ${userId} in ${language.name}: ${words.map((word) => word.word).join(', ')}`
	);

	return json({});
};
