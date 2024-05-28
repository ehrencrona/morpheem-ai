import { json, type ServerLoad } from '@sveltejs/kit';
import { getWordsByPrefix } from '../../../../../db/words';

export const GET: ServerLoad = async ({ params, locals: { language } }) =>
	json(await getWordsByPrefix(params.prefix!, { limit: 20, language }));
