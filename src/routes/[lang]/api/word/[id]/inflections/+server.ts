import { json, type ServerLoad } from '@sveltejs/kit';
import { getInflections } from '../../../../../../db/lemmas';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const wordId = parseInt(params.id!);

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	return json(await getInflections(wordId, language));
};
