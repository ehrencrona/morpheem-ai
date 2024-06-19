import { json, type ServerLoad } from '@sveltejs/kit';
import { getSentence } from '../../../../../../db/sentences';
import { addEnglishToSentence } from '../../../../../../logic/translate';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	const { english, transliteration } = await addEnglishToSentence(
		await getSentence(sentenceId, language),
		language
	);

	return json({ english, transliteration });
};
