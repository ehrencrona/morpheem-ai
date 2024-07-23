import type { ServerLoad } from '@sveltejs/kit';
import { getWords } from '../../../db/words';

export const load = (async ({ locals: { language } }) => {
	return {
		languageCode: language.code,
		words: (
			await getWords({
				orderBy: 'word asc',
				language,
				limit: 200
			})
		).map((w) => w.word)
	};
}) satisfies ServerLoad;
