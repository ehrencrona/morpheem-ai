import { redirectToLogin } from '$lib/redirectToLogin';
import { error, type ServerLoad } from '@sveltejs/kit';
import { getUnits } from '../../../db/units';

export const load: ServerLoad = async ({ params, locals: { user, language }, url }) => {
	if (!language) {
		return error(404, 'Language not found');
	}

	return {
		units: await getUnits(language)
	};
};
