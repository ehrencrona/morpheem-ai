import { redirectToLogin } from '$lib/redirectToLogin';
import { error, type ServerLoad } from '@sveltejs/kit';
import { getUnits } from '../../db/units';
import { getUserExercises } from '../../db/userExercises';
import { getUserSettings } from '../../db/userSettings';
import { cullUserExercises } from '../../logic/cullUserExercises';
import { logError } from '$lib/logError';

export const load: ServerLoad = async ({
	setHeaders,
	locals: { user, language, isAdmin },
	url
}) => {
	if (!user) {
		return redirectToLogin(url);
	}

	if (!language) {
		return error(404, 'Language not found');
	}

	const [units, unit] = await Promise.all([
		getUnits(language),
		getUserSettings(user.num, language).then((res) => res?.unit || null)
	]);

	const userExercises = await getUserExercises(user.num, language);

	// intentionally async
	cullUserExercises(userExercises, { userId: user.num, language }).catch(logError);

	setHeaders({
		'cache-control': 'no-cache'
	});

	return {
		languageCode: language.code,
		userExercises,
		isAdmin,
		units,
		unit
	};
};
