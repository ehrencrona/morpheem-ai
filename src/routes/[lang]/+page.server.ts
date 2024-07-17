import { redirectToLogin } from '$lib/redirectToLogin';
import { error, type ServerLoad } from '@sveltejs/kit';
import { getUnits } from '../../db/units';
import { getUserExercises } from '../../db/userExercises';
import { getUserSettings } from '../../db/userSettings';

export const load: ServerLoad = async ({ locals: { user, language }, url }) => {
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

	return {
		languageCode: language.code,
		userExercises: await getUserExercises(user.num, language),
		isSuperUser: user.num == 4711,
		units,
		unit
	};
};
