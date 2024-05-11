import { json, type ServerLoad } from '@sveltejs/kit';
import { getWordById } from '../../../../../db/words';
import { addSentencesForWord } from '../../../../../logic/addSentencesForWord';
import { getSentencesWithWord } from '../../../../../logic/getSentencesWithWord';

export type SentencesWithWords = Awaited<ReturnType<typeof getSentencesWithWord>>;

export const GET: ServerLoad = async ({ params }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	const word = await getWordById(wordId);

	console.log(`Getting sentences with word: ${word.word} (${wordId})`);

	return new Response(JSON.stringify(await getSentencesWithWord(word)), {
		headers: {
			'content-type': 'application/json'
		}
	});
};

/** Add more examples of this word if there aren't any unseen. */
export const POST: ServerLoad = async ({ params }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	const word = await getWordById(wordId);

	console.log(`Add sentences with word: ${word.word} (${wordId})`);

	const sentences = await addSentencesForWord(word).then(() => {
		console.log(`Done adding sentences with word: ${word.word} (${wordId})`);
	});

	return json(sentences);
};
