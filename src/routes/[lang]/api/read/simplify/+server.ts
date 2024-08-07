import { filterUndefineds } from '$lib/filterUndefineds';
import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { simplifyText } from '../../../../../ai/simplifyText';
import { getAggregateKnowledgeForUserWords } from '../../../../../db/knowledge';
import { getLemmasOfWords } from '../../../../../db/lemmas';
import * as DB from '../../../../../db/types';
import { expectedKnowledge, now } from '../../../../../logic/isomorphic/knowledge';
import { toWordStrings } from '../../../../../logic/toWordStrings';
import { Language } from '../../../../../logic/types';
import { toSentences } from '../../../../../logic/toSentences';
import { dedup, dedupWords } from '$lib/dedup';

const postSchema = z.object({
	text: z.string()
});

export const POST: ServerLoad = async ({ request, locals: { language, userId } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const { text } = postSchema.parse(await request.json());

	return json(
		await simplifyText(text, {
			language,
			hardWords: await getHardWordsInSentences(toSentences(text), {
				userId,
				language
			})
		})
	);
};

async function getHardWordsInSentences(
	sentences: string[],
	{ userId, language }: { userId: number; language: Language }
) {
	let hardWords: string[] = [];

	const words = dedupWords(
		(
			await Promise.all(
				sentences.map(async (sentence) => {
					let wordStrings = toWordStrings(sentence, language, { doLowerCase: false });

					// skip names
					wordStrings = wordStrings.filter((word) => !isCapitalized(word));

					const words = await getLemmasOfWords(wordStrings, language);

					wordStrings.forEach((wordString, i) => {
						if (words[i].length == 0) {
							hardWords.push(wordString);
						}
					});

					return filterUndefineds(words.map((lemmas) => lemmas[0] as DB.Word | undefined));
				})
			)
		).flat()
	);

	const knowledge = await getAggregateKnowledgeForUserWords({
		wordIds: words.map(({ id }) => id),
		userId,
		language
	});

	knowledge.forEach((k) => {
		if (expectedKnowledge(k, { now: now(), exercise: 'read' }) < 0.5) {
			hardWords.push(k.word);
		}
	});

	return dedup(hardWords);
}

function isCapitalized(word: string) {
	return word[0] == word[0].toUpperCase();
}
