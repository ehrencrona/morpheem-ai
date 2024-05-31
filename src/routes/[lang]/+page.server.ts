import { redirectToLogin } from '$lib/redirectToLogin';
import { error, redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals: { user, language }, url }) => {
	if (!user) {
		return redirectToLogin(url);
	}

	if (!language) {
		return error(404, 'Language not found');
	}

	return {
		languageCode: language.code
	};
};
