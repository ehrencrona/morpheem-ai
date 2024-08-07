import { json, type ServerLoad } from '@sveltejs/kit';
import { addSeenSentence } from '../../../../../db/sentencesSeen';
import { getCandidateSentence } from '../../../../../logic/getSentencesWithWord';
import { addEnglishToSentence } from '../../../../../logic/translate';
import { deleteSentence } from '../../../../../db/sentences';

export const POST: ServerLoad = async ({ params, locals: { userId, language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	await addSeenSentence(sentenceId, userId!, language);

	return json({});
};

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	return json(
		await addEnglishToSentence(await getCandidateSentence(sentenceId, language), language)
	);
};

export const DELETE: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	await deleteSentence(sentenceId, language);

	return json({});
};
