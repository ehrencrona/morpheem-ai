import type { ServerLoad } from '@sveltejs/kit';
import { getWords } from '../../db/words';

export const load = (async ({}) => {
	return {
		words: await getWords('word asc')
	};
}) satisfies ServerLoad;
