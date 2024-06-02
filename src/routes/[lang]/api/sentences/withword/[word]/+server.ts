import { json, type ServerLoad } from '@sveltejs/kit';
import { getWordById } from '../../../../../../db/words';
import { addSentencesForWord } from '../../../../../../logic/addSentencesForWord';
import { getSentencesWithWord } from '../../../../../../logic/getSentencesWithWord';
import { CandidateSentenceWithWords } from '../../../../../../logic/types';

export const GET: ServerLoad = async ({ params, locals: { language } }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	const word = await getWordById(wordId, language);

	console.log(`Getting sentences with word: ${word.word} (${wordId})`);

	return new Response(JSON.stringify(await getSentencesWithWord(word, language)), {
		headers: {
			'content-type': 'application/json'
		}
	});
};

/** Add more examples of this word if there aren't any unseen. */
export const POST: ServerLoad = async ({ params, locals: { userId, language } }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	const word = await getWordById(wordId, language);

	console.log(`Add sentences with word: ${word.word} (${wordId})`);

	const sentences: CandidateSentenceWithWords[] = await addSentencesForWord(word, {
		userId: userId!,
		language
	}).then((res) => {
		console.log(`Done adding sentences with word: ${word.word} (${wordId})`);

		return res;
	});

	return json(sentences);
};
