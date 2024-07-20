import { json, type ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';
import { setSentenceUnit } from '../../../../../../db/sentences';

const putSchema = z.object({
	unit: z.number().nullable()
});

export const PUT: ServerLoad = async ({ request, params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	const body = putSchema.parse(await request.json());

	await setSentenceUnit(body.unit, sentenceId, language);

	return json({});
};
