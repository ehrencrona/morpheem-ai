import { json, type ServerLoad } from '@sveltejs/kit';
import {
	Clause,
	splitIntoClauses,
	splitIntoClausesAndTranslate
} from '../../../../../../ai/splitIntoClauses';
import { getSentence, storeEnglish } from '../../../../../../db/sentences';
import { Language } from '../../../../../../logic/types';
import { logError } from '$lib/logError';

export type ClausesResponse = Awaited<ReturnType<typeof getClauses>>;

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const sentenceId = parseInt(params.sentence || '');

	if (isNaN(sentenceId)) {
		throw new Error('Invalid sentence ID');
	}

	return json(await getClauses(sentenceId, language));
};

async function getClauses(sentenceId: number, language: Language) {
	const sentence = await getSentence(sentenceId, language);

	let clauses: Clause[] = [];
	let english: string = '';

	if (sentence.english) {
		clauses = await splitIntoClauses(sentence, language);
		english = sentence.english;
	} else {
		({ translation: english, clauses } = await splitIntoClausesAndTranslate(sentence, language));

		storeEnglish({ english: sentence.english || '' }, { sentenceId: sentence.id, language }).catch(
			logError
		);
	}

	return {
		clauses,
		english,
		transliteration: sentence.transliteration || undefined
	};
}
