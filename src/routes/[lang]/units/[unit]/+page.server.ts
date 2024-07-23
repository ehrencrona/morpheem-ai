import { error, type ServerLoad } from '@sveltejs/kit';
import { getSentences } from '../../../../db/sentences';
import { getUnits } from '../../../../db/units';
import { getWords, getWordsOfSentences } from '../../../../db/words';

export const load: ServerLoad = async ({ params, locals: { user, language, isAdmin }, url }) => {
	if (!language) {
		return error(404, 'Language not found');
	}

	const unitId = parseInt(params.unit || '');

	if (!unitId) {
		return error(404, 'Unit not found');
	}

	const [sentences, words] = await Promise.all([
		getSentences(language, unitId),
		getWords({ upToUnit: unitId, language })
	]);

	const sentenceWords = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	const units = await getUnits(language);
	const unit = units.find(({ id }) => id === unitId);

	if (!unit) {
		return error(404, 'Unit not found');
	}

	return {
		sentences: sentences.map((sentence, i) => ({
			id: sentence.id,
			sentence: sentence.sentence,
			words: sentenceWords[i].map((word) => word.word)
		})),
		isAdmin,
		words,
		unit
	};
};
