import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ locals: { language } }) => {
	return {
		languageCode: language.code
	};
}) satisfies ServerLoad;
