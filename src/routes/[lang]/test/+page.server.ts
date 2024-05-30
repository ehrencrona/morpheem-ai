import { ServerLoad, redirect } from '@sveltejs/kit';
import { getSentenceIds, getSentencesByIds } from '../../../db/sentences';
import { getWordsOfSentence } from '../../../db/words';
import { pick } from '$lib/pick';

export const load: ServerLoad = async ({ locals: { language, userId } }) => {
	if (!userId) {
		return redirect(302, `/login`);
	}

	const ids = await getSentenceIds(language);

	const sentences = await getSentencesByIds(
		pick(
			ids.map(({ id }) => id),
			20
		),
		language
	);

	const words = await Promise.all(sentences.map(({ id }) => getWordsOfSentence(id, language)));

	return {
		sentences: zip(sentences, words).map(([sentence, words]) => ({ sentence, words })),
		languageCode: language.code
	};
};

function zip<T, U>(a: T[], b: U[]): [T, U][] {
	return a.map((value, index) => [value, b[index]]);
}
