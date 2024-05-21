import { json, type ServerLoad } from '@sveltejs/kit';
import { getWordsByPrefix } from '../../../../../db/words';

export const GET: ServerLoad = async ({ params }) =>
	json(await getWordsByPrefix(params.prefix!, 20));
