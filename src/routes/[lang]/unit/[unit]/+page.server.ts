import { redirectToLogin } from '$lib/redirectToLogin';
import { error, type ServerLoad } from '@sveltejs/kit';
import { getSentences } from '../../../../db/sentences';
import { getUnits } from '../../../../db/units';
import { getWords, getWordsOfSentences } from '../../../../db/words';

export const load: ServerLoad = async ({ params, locals: { user, language }, url }) => {
	if (!user) {
		return redirectToLogin(url);
	}

	if (!language) {
		return error(404, 'Language not found');
	}

	const unit = parseInt(params.unit || '');

	if (!unit) {
		return error(404, 'Unit not found');
	}

	const [sentences, words] = await Promise.all([
		getSentences(language, unit),
		getWords({ upToUnit: unit, language })
	]);

	const sentenceWords = await getWordsOfSentences(
		sentences.map(({ id }) => id),
		language
	);

	const units = await getUnits(language);

	return {
		sentences: sentences.map((sentence, i) => ({
			id: sentence.id,
			sentence: sentence.sentence,
			words: sentenceWords[i].map((word) => word.word)
		})),
		words,
		unit: units[unit - 1]
	};
};
