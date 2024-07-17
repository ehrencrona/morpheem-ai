import { error, json, type ServerLoad } from '@sveltejs/kit';
import { getWordById } from '../../../../../../db/words';
import { addSentencesForWord } from '../../../../../../logic/addSentencesForWord';
import { getSentencesWithWord } from '../../../../../../logic/getSentencesWithWord';
import { CandidateSentenceWithWords } from '../../../../../../logic/types';
import { getUserSettings } from '../../../../../../db/userSettings';

export const GET: ServerLoad = async ({ params, locals: { language, userId } }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const unit = (await getUserSettings(userId, language))?.unit || undefined;

	const word = await getWordById(wordId, language);

	console.log(`Getting sentences with word: ${word.word} (${wordId})`);

	return new Response(
		JSON.stringify(await getSentencesWithWord(word, { language, userId, upToUnit: unit })),
		{
			headers: {
				'content-type': 'application/json'
			}
		}
	);
};

/** Add more examples of this word if there aren't any unseen. */
export const POST: ServerLoad = async ({ params, locals: { userId, language } }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	if (!userId) {
		return error(401, 'Unauthorized');
	}

	const unit = (await getUserSettings(userId, language))?.unit || undefined;

	if (unit) {
		console.warn(
			`Unable to generate new sentences for word ${wordId} because user is on unit ${unit}`
		);

		return json([]);
	}

	const word = await getWordById(wordId, language);

	console.log(`Add sentences with word: ${word.word} (${wordId})`);

	const sentences: CandidateSentenceWithWords[] = await addSentencesForWord(word, {
		userId: userId || undefined,
		language
	}).then((res) => {
		console.log(`Done adding ${res.length} sentences with word: ${word.word} (${wordId})`);

		return res;
	});

	return json(sentences);
};
