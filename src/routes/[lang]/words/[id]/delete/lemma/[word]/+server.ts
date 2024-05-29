import { ServerLoad, redirect } from '@sveltejs/kit';
import { deleteWordToLemma } from '../../../../../../../db/lemmas';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const wordId = parseInt(params.id || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	await deleteWordToLemma(wordId, params.word!, language);

	return redirect(302, `/${language.code}/words/${wordId}`);
};
