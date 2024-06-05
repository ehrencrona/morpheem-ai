import { redirectToLogin } from '$lib/redirectToLogin';
import { error, type ServerLoad } from '@sveltejs/kit';
import { getUserExercises } from '../../db/userExercises';

export const load: ServerLoad = async ({ locals: { user, language }, url }) => {
	if (!user) {
		return redirectToLogin(url);
	}

	if (!language) {
		return error(404, 'Language not found');
	}

	return {
		languageCode: language.code,
		userExercises: await getUserExercises(user.num, language)
	};
};
