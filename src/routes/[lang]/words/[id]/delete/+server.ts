import { ServerLoad, error, redirect } from '@sveltejs/kit';
import { deleteWord } from '../../../../../db/words';

export const GET: ServerLoad = async ({ params, locals: { language, isAdmin } }) => {
	const wordId = parseInt(params.id || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	if (!isAdmin) {
		return error(403, 'Forbidden');
	}

	await deleteWord(wordId, language);

	return redirect(302, `/${language.code}/words`);
};
