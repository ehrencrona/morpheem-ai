import type { ServerLoad } from '@sveltejs/kit';
import { getWords } from '../../db/words';

export const load = (async ({ params }) => {
	return {
		words: await getWords()
	};
}) satisfies ServerLoad;
