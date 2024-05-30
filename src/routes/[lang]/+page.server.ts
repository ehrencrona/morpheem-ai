import { error, redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals: { user, language } }) => {
	if (!user) {
		return redirect(302, '/login');
	}

	if (!language) {
		return error(404, 'Language not found');
	}

	return {
		languageCode: language.code
	};
};
