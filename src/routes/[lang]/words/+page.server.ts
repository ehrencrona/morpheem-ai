import type { ServerLoad } from '@sveltejs/kit';
import { getWords } from '../../../db/words';

export const load = (async ({ locals: { language } }) => {
	return {
		languageCode: language.code
	};
}) satisfies ServerLoad;
