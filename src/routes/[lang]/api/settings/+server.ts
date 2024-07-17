import { ServerLoad, error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { updateUserSettings } from '../../../../db/userSettings';
import { getUnits } from '../../../../db/units';

const postSchema = z.object({
	unit: z.number().nullable().optional()
});

export type PostSchema = z.infer<typeof postSchema>;

export const PUT: ServerLoad = async ({ request, params, locals: { language, userId } }) => {
	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const settings = postSchema.parse(await request.json());

	const units = await getUnits(language);

	if (!units.find(({ id }) => id == settings.unit)) {
		console.error(`Invalid unit "${settings.unit}". Clearing unit for user ${userId}`);

		settings.unit = null;
	}

	await updateUserSettings(
		{
			unit: settings.unit
		},
		userId,
		language
	);

	console.log(`User ${userId} changed unit to ${settings.unit}`);

	return json({ success: true });
};
