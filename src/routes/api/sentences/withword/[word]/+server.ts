import type { ServerLoad } from '@sveltejs/kit';
import { getSentencesWithWord as getSentencesWithWordFromDb } from '../../../../../db/sentences';
import { getWordById, getWordsOfSentence } from '../../../../../db/words';
import { getLastSeen } from '../../../../../db/sentencesSeen';
import type * as DB from '../../../../../db/types';
import { addSentencesForWord } from '../../../../../logic/addSentencesForWord';

export type SentencesWithWords = Awaited<ReturnType<typeof getSentencesWithWord>>;

export const GET: ServerLoad = async ({ params }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	const word = await getWordById(wordId);

	console.log(`Getting sentences with word: ${word.word} (${wordId})`);

	return new Response(JSON.stringify(await getSentencesWithWord(wordId)), {
		headers: {
			'content-type': 'application/json'
		}
	});
};

export const POST: ServerLoad = async ({ params }) => {
	const wordId = parseInt(params.word || '');

	if (isNaN(wordId)) {
		throw new Error('Invalid word ID');
	}

	const word = await getWordById(wordId);

	const sentences = await getSentencesWithWord(wordId);
	const notSeenCount = sentences.filter(({ lastSeen }) => lastSeen === undefined).length;

	if (notSeenCount == 0) {
		console.log(`Add sentences with word: ${word.word} (${wordId})`);

		addSentencesForWord(word.word, 4).then(() => {
			console.log(`Done adding sentences with word: ${word.word} (${wordId})`);
		});
	}

	return new Response(JSON.stringify({}), {
		headers: {
			'content-type': 'application/json'
		}
	});
};

async function getSentencesWithWord(wordId: number): Promise<
	(DB.Sentence & {
		words: DB.Word[];
		lastSeen: number | undefined;
	})[]
> {
	const sentences = await getSentencesWithWordFromDb(wordId);

	const lastSeen = await getLastSeen(sentences.map((sentence) => sentence.id));

	const words = await Promise.all(sentences.map((sentence) => getWordsOfSentence(sentence.id!)));

	return sentences.map((sentence, i) => ({
		...sentence,
		words: words[i],
		lastSeen: lastSeen[i]
	}));
}
