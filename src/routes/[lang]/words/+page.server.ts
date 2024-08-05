import type { ServerLoad } from '@sveltejs/kit';
import { getWords } from '../../../db/words';

export const load: ServerLoad = async ({ locals: { language, isAdmin } }) => {
	return {
		languageCode: language.code,
		words: (
			await getWords({
				orderBy: 'word asc',
				language,
				limit: 200
			})
		).map((w) => w.word),
		isAdmin
	};
};
