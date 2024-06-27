import { redirectToLogin } from '$lib/redirectToLogin';
import { type ServerLoad } from '@sveltejs/kit';
import { getActivity } from '../../../db/wordsKnown';

export const load = (async ({ locals, url }) => {
	const { language } = locals;

	if (!locals.user) {
		return redirectToLogin(url);
	}

	const userId = locals.user.num;

	return {
		activity: await getActivity(userId, language)
	};
}) satisfies ServerLoad;
