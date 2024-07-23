import { error, json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { setWordUnit } from '../../../../../../db/words';

const postSchema = z.object({
	unit: z.number().nullable()
});

export const PUT: ServerLoad = async ({
	request,
	params,
	locals: { userId, language, isAdmin }
}) => {
	if (userId != 4711) {
		return error(401, 'Unauthorized');
	}

	if (!isAdmin) {
		return error(403, 'Forbidden');
	}

	let { unit } = postSchema.parse(await request.json());

	const wordId = parseInt(params.id!);

	await setWordUnit(unit, wordId, language);

	return json({});
};
