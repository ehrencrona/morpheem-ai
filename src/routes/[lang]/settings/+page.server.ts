import { error, type ServerLoad } from '@sveltejs/kit';
import { getUnits } from '../../../db/units';
import { getUserSettings } from '../../../db/userSettings';

export const load = (async ({ locals: { language, userId } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const unit = (await getUserSettings(userId, language))?.unit || null;

	return { unit, units: await getUnits(language), languageCode: language.code };
}) satisfies ServerLoad;
