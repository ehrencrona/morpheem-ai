import { ServerLoad, error, redirect } from '@sveltejs/kit';
import { deleteWordToLemma } from '../../../../../../../db/lemmas';

export const GET: ServerLoad = async ({ params, locals: { language, isAdmin } }) => {
	const wordId = parseInt(params.id || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	if (!isAdmin) {
		return error(403, 'Forbidden');
	}

	await deleteWordToLemma(wordId, params.word!, language);

	return redirect(302, `/${language.code}/words/${wordId}`);
};
