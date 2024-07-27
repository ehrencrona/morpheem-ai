import { error, json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { setSentenceUnit } from '../../../../../db/sentences';

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

	const sentenceId = parseInt(params.id!);

	await setSentenceUnit(unit, sentenceId, language);

	return json({});
};
