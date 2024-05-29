import type { ServerLoad } from '@sveltejs/kit';
import { getSentences } from '../../../db/sentences';

export const load = (async ({ locals: { language } }) => {
	return { sentences: await getSentences(language), languageCode: language.code };
}) satisfies ServerLoad;
