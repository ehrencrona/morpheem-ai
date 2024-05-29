import { ServerLoad, redirect } from '@sveltejs/kit';
import { deleteSentence } from '../../../../../db/sentences';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.id || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	await deleteSentence(sentenceId, language);

	return redirect(302, `/${language.code}/`);
};
