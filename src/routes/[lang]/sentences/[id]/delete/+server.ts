import { ServerLoad, error, redirect } from '@sveltejs/kit';
import { deleteSentence } from '../../../../../db/sentences';

export const GET: ServerLoad = async ({ params, locals: { language, isAdmin } }) => {
	const sentenceId = parseInt(params.id || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	if (!isAdmin) {
		return error(403, 'Forbidden');
	}

	await deleteSentence(sentenceId, language);

	return redirect(302, `/${language.code}/`);
};
