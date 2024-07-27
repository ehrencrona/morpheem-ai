import { json, type ServerLoad } from '@sveltejs/kit';
import { getUnits } from '../../../../db/units';

export const GET: ServerLoad = async ({ locals: { language } }) => {
	return json(await getUnits(language));
};
