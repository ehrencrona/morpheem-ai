import { ServerLoad, redirect } from '@sveltejs/kit';
import { deleteWord } from '../../../../db/words';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const wordId = parseInt(params.id || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	await deleteWord(wordId, language);

	return redirect(302, '/words');
};
