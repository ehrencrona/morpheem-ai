import type { ServerLoad } from '@sveltejs/kit';
import { getSentences } from '../../db/sentences';

export const load = (async ({ params }) => {
	return { sentences: await getSentences() };
}) satisfies ServerLoad;
