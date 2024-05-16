import { ServerLoad, redirect } from '@sveltejs/kit';
import { deleteWordToLemma } from '../../../../../../db/lemmas';

export const GET: ServerLoad = async ({ params }) => {
	const wordId = parseInt(params.id || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	await deleteWordToLemma(wordId, params.word!);

	return redirect(302, `/words/${wordId}`);
};
