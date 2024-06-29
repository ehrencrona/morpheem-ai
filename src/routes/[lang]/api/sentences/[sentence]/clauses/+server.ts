import { json, type ServerLoad } from '@sveltejs/kit';
import { getSentence } from '../../../../../../db/sentences';
import { addEnglishToSentence } from '../../../../../../logic/translate';
import { splitIntoClauses } from '../../../../../../ai/splitIntoClauses';
import { Language } from '../../../../../../logic/types';

export type ClausesResponse = Awaited<ReturnType<typeof getClauses>>;

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	return json(await getClauses(sentenceId, language));
};

async function getClauses(sentenceId: number, language: Language) {
	const sentence = await addEnglishToSentence(await getSentence(sentenceId, language), language);

	const clauses = await splitIntoClauses(sentence, language);

	return {
		clauses,
		english: sentence.english,
		transliteration: sentence.transliteration || undefined
	};
}
