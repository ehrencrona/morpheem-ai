import { pick } from '$lib/pick';
import { redirectToLogin } from '$lib/redirectToLogin';
import { zip } from '$lib/zip';
import { ServerLoad } from '@sveltejs/kit';
import { getSentenceIds, getSentencesByIds } from '../../../db/sentences';
import { getWordsOfSentences } from '../../../db/words';

export const load: ServerLoad = async ({ locals: { language, userId }, url }) => {
	if (!userId) {
		return redirectToLogin(url);
	}

	const ids = await getSentenceIds(language);

	const sentences = await getSentencesByIds(
		pick(
			ids.map(({ id }) => id),
			20
		),
		language
	);

	const words = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	return {
		sentences: zip(sentences, words).map(([sentence, words]) => ({ sentence, words })),
		languageCode: language.code
	};
};

